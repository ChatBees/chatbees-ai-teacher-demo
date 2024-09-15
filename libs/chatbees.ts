const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
export const COLLECTION_NAME = process.env.NEXT_PUBLIC_COLLECTION_NAME;

export function getAccountID() {
  return ACCOUNT_ID;
}

export function getApiKey() {
  return API_KEY;
}

//const baseurl = '.us-west-2.aws.chatbees.ai'
const baseurl = process.env.NEXT_PUBLIC_CHATBEES_BASEURL ?? '.us-west-2.aws.chatbees.ai';

export function getServiceUrl(aid: string): string {
  if (baseurl == 'localhost') {
    return 'http://localhost:8080';
  }
  return 'https://' + aid + baseurl;
}

export function getHeaders(
  aid: string,
  apiKey: string,
  upload: boolean = false,
): { [key: string]: string } {
  let headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    'api-key': apiKey,
  };

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  if (baseurl == 'localhost' || (isBrowser && window.location.origin.includes('localhost'))) {
    headers['x-org-url'] = aid;
  }

  if (upload) {
    delete headers['Content-Type'];
  }
  return headers;
}

async function doFetchUrl<T = any>(aid: string, apiKey: string, url: string, body: BodyInit): Promise<T | any> {
  const headers: HeadersInit = getHeaders(aid, apiKey);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status != 401) {
      throw new Error(
        `status: ${response.status}, error: ${response.statusText}`,
        { cause: response.status },
      );
    }

    // 401 errors bypass error check. We'll redirect users to login page
  } catch (error) {

    console.log('Caught error ', error);
    throw error;
  }
}

async function fetchUrl<T = any>(
  aid: string,
  apiKey: string,
  urlSuffix: string,
  body: BodyInit,
): Promise<T> {
  if (aid == '') {
    throw new Error('Account ID not found', { cause: 404 });
  }

  const url: string = getServiceUrl(aid) + urlSuffix;

  return await doFetchUrl<T>(aid, apiKey, url, body);
}

// for upload local audio file, see admin ui, src/components/CollectionDetail/FileDropZone.tsx
export async function TranscribeRemoteAudio(
  aid: string,
  apiKey: string,
  collectionName: string,
  url: string,
): Promise<string> {
  const urlSuffix = '/docs/transcribe_audio';
  const jsonBody = JSON.stringify({
    namespace_name: 'public',
    collection_name: collectionName,
    url: url,
  });

  // data: { "transcript": string }
  const data = await fetchUrl(aid, apiKey, urlSuffix, jsonBody);
  return data['transcript'];
}

export type FAQ = {
  question: string;
  answer: string;
}

export type OutlineFAQResponse = {
  outlines: string[];
  faqs: FAQ[];
}

export async function GetOutlineFAQ(
  aid: string,
  apiKey: string,
  collectionName: string,
  docName: string,
): Promise<OutlineFAQResponse> {
  const urlSuffix = '/docs/get_outline_faq';
  const jsonBody = JSON.stringify({
    namespace_name: 'public',
    collection_name: collectionName,
    doc_name: docName,
  });

  console.log(jsonBody);

  const data = await fetchUrl(aid, apiKey, urlSuffix, jsonBody);
  return { outlines: data['outlines'], faqs: data['faqs'] };
}

export async function SummarizeDoc(
  aid: string,
  apiKey: string,
  collectionName: string,
  docName: string,
): Promise<string> {
  const urlSuffix = '/docs/summary';
  const jsonBody = JSON.stringify({
    namespace_name: 'public',
    collection_name: collectionName,
    doc_name: docName,
  });

  const data = await fetchUrl(aid, apiKey, urlSuffix, jsonBody);
  return data['summary'];
}

interface OriginalAnswerRef {
  doc_name: string;
  page_num: number;
  sample_text: string;
}

export interface AnswerRef {
  docName: string;
  pageNum: number;
  sampleText: string;
}

export interface BotAnswer {
  answer: string;
  refs: AnswerRef[];
  conversation_id: string;
  request_id: string;
}

export async function Ask(
  aid: string,
  apiKey: string,
  collectionName: string,
  docName: string,
  question: string,
  historyMessages: string[][],
  conversation_id: string | null,
): Promise<BotAnswer> {
  const url_suffix = '/docs/ask';
  const json_body =
    historyMessages.length == 0
      ? JSON.stringify({
        doc_name: docName,
        collection_name: collectionName,
        namespace_name: 'public',
        question: question,
        conversation_id: conversation_id,
      })
      : JSON.stringify({
        doc_name: docName,
        collection_name: collectionName,
        namespace_name: 'public',
        question: question,
        history_messages: historyMessages,
        conversation_id: conversation_id,
      });

  const respData = await fetchUrl(aid, apiKey, url_suffix, json_body);

  const answer = respData['answer'];
  const refs: AnswerRef[] = (respData['refs'] as OriginalAnswerRef[]).map(({ doc_name, page_num, sample_text }) => ({
    docName: doc_name,
    pageNum: page_num,
    sampleText: sample_text,
  }));

  return {
    answer,
    refs,
    conversation_id: respData['conversation_id'],
    request_id: respData['request_id'],
  };
}
