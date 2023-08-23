from __future__ import absolute_import, unicode_literals
from celery import shared_task
from celery.utils.log import get_task_logger
import json
import requests
import boto3

logger = get_task_logger(__name__)


def parse_srt(srt_data, video_url):
    subtitles = []
    lines = srt_data.splitlines()

    sub_number = None
    sub_timing = None
    sub_text = []

    for line in lines:
        line = line.strip()

        if not line:
            if sub_number is not None:
                subtitles.append({
                    # 'number': sub_number,
                    'timing': sub_timing,
                    'subtitle': '\n'.join(sub_text),
                    "video_url": video_url
                })

            sub_number = None
            sub_timing = None
            sub_text = []

        elif sub_number is None:
            try:
                sub_number = int(line.lstrip('\ufeff').strip())
            except ValueError:
                pass

        elif sub_timing is None:
            sub_timing = line

        else:
            sub_text.append(line)

    return subtitles


@shared_task(bind=True)
def upload_to_dynamodb(self, video_url, subtitles):
    dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
    table = dynamodb.Table('ecowiser-subtitles')

    try:
        table.put_item(
            Item={
                'video_url': video_url,
                'subtitles': json.dumps(subtitles)
            }
        )
    except Exception as e:
        logger.error(e)
        return {'message': 'Failed to upload subtitles to DynamoDB'}

    return {'message': 'Subtitles uploaded to DynamoDB'}


@shared_task(bind=True)
def update_elasticsearch(self, subtitles):
    payload = {"subtitles": subtitles}

    url = "http://172.22.192.248:5001/subtitles/bulk/"

    headers = {"Content-Type": "application/json;charset=utf-8"}

    try:
        result = requests.request(
            "POST", url, data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), headers=headers)

        if result.status_code != 200:
            raise Exception(result.text)

        return {
            'message': 'Subtitles uploaded to Elasticsearch',
            'result': result.json()
        }

    except Exception as e:
        logger.error(e)
        return {'message': 'Failed to upload subtitles to Elasticsearch'}


@ shared_task(bind=True)
def extract_subtitles(self, video_url):
    part_to_extract = video_url.split(
        "https://ecowiser-media.s3.amazonaws.com/")[1]

    payload = json.dumps({"url": part_to_extract})

    url = "http://172.22.192.248:5000/extract"

    headers = {"Content-Type": "application/json"}

    result = requests.request("POST", url, data=payload, headers=headers)

    subtitles = parse_srt(result.json()['ccextractorOutput'], video_url)

    counter, batches = 0, []

    for subtitle in subtitles:
        # upload_to_dynamodb.delay(video_url, subtitle)

        if counter == 100:
            update_elasticsearch.delay(batches)
            batches, counter = [], 0

        batches.append(subtitle)

        counter += 1

    if len(batches) > 0:
        update_elasticsearch.delay(batches)

    return subtitles
