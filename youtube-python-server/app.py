import os
from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from anthropic import Anthropic

app = Flask(__name__)
client = Anthropic(api_key="__")

def summarize_video(transcript):
    prompt = f"""
    You are a YouTube video summarizer. Provide a concise summary of the following video transcript:

    {transcript}

    Your summary should include:
    1. The main topic or theme of the video
    2. Key points or arguments presented
    3. Any important conclusions or takeaways

    Please keep the summary brief and to the point.
    """
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1000,
            temperature=0.2,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

@app.route('/get_summary', methods=['GET'])
def get_summary():
    video_id = request.args.get('video_id')
    if not video_id:
        return jsonify({'error': 'Missing video_id parameter'}), 400

    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        transcript_text = " ".join([item['text'] for item in transcript])
        print("Transcript:", transcript_text)  # Log the fetched transcript
        summary = summarize_video(transcript_text)
        print("Summary fetched successfully:", summary)  # Log the fetched summary
        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002)

