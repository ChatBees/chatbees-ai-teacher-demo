const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID;
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export function getAccountID() {
  return ACCOUNT_ID;
}

//const baseurl = '.us-west-2.aws.chatbees.ai'
const baseurl =  process.env.NEXT_PUBLIC_CHATBEES_BASEURL ?? '.us-west-2.aws.chatbees.ai';

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
  if (baseurl == 'localhost' || window.location.origin.includes('localhost')) {
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

  return await doFetchUrl<T>(aid, apiKey, url, body)
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
  return { data['transcript'] };
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

  const data = await fetchUrl(aid, apiKey, urlSuffix, jsonBody);
  return { outlines: data['outlines']; faqs: data['faqs'] };
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
  return { data['summary'] };
}

