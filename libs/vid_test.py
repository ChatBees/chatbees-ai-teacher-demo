import chatbees as cb

# Create an API key on UI after signup/signin.
# Configure cb to use the newly minted API key.
# export ENV_TEST_BASE_URL=http://localhost:8080
cb.init(api_key="MDItMDAwMDAwMDAtNDFlZTY3MjYtMzcwZS1kNTM2LTRiNDAtYmNhYjcyYjVmNTBj",
        account_id="IYT7YW3F")

# Create a new collection
vid_col = cb.Collection(name="chatbees")
# vid_col = cb.Collection(name="vid_ja_zh")

# audio_file_path = "/Users/junluo/Documents/chatbees/customers/JP-edu-video/test_5s.mp3"
# resp = vid_col.transcribe_audio(audio_file_path, 'ja')
audio_file_url = "https://www.chatbees.ai/images/audio/test_5s.mp3"
resp = vid_col.transcribe_audio(audio_file_url, 'ja')  # , access_token)
print(resp)

# upload vid1.txt
vid1 = "T1_tran.txt"
vid1_path = f"~/Documents/chatbees/customers/JP-edu-video/{vid1}"
vid_col.upload_document(vid1_path)

# get outlines and faqs
outline_faq_resp = vid_col.get_document_outline_faq(vid1)
print(outline_faq_resp.outlines)
print(outline_faq_resp.faqs)


# upload vid1.txt
vid1 = "T1.txt"

# Get answer from vid1
questions = [
    #    "采购折扣は収益ですか、それとも費用ですか？"
    "「采购折扣」科目は「收到の利息」科目に置き換えることができますか？",
    "「割引」は何でしょうか？"
]

vid_col.summary(doc_name=vid1)

for q in questions:
    ask_resp = vid_col.ask(q, doc_name=vid1)
    # ask_resp = vid_col.ask(q)
    print(ask_resp.answer)
