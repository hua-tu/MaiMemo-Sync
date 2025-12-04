import * as cheerio from "cheerio";

const BASE_URL = "https://www.maimemo.com";

const HEADERS = {
  authority: "www.maimemo.com",
  accept: "application/json, text/javascript, */*; q=0.01",
  "accept-language": "zh-CN,zh;q=0.9",
  origin: "https://www.maimemo.com",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface NotepadDetail {
  notepadId: string;
  title: string;
  brief: string;
  contentList: string[];
  isPrivacy: boolean;
  tags: string[];
}

export class MaiMemoService {
  /**
   * Login to MaiMemo and return the cookie string.
   */
  static async login(email: string, password: string): Promise<string> {
    const url = `${BASE_URL}/auth/login`;
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...HEADERS,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const data = await response.json();

    if (data.valid !== 1) {
      throw new Error(data.error || "Login failed");
    }

    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) {
      throw new Error("No cookie returned");
    }

    // Extract relevant cookies
    const cookies = setCookie
      .split(",")
      .map((c) => c.split(";")[0])
      .join("; ");

    return cookies;
  }

  /**
   * Get notepad details by ID.
   */
  static async getNotepadDetail(
    cookie: string,
    notepadId: string
  ): Promise<NotepadDetail> {
    const url = `${BASE_URL}/notepad/detail/${notepadId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...HEADERS,
        cookie: cookie,
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("#title").val() as string;
    const brief = $("#brief").val() as string;
    const content = $("#content").text();
    const contentList = content
      ? content.split(/[\r\n,]+/).filter((s) => s.trim())
      : [];
    // console.log("content", contentList);
    const isPrivacy =
      $("#notepadPrivacy a.active").attr("data-private") === "1";
    const tags = $("#notepadTags a.active")
      .map((_, el) => $(el).attr("data-tag"))
      .get();

    if (!title && !content) {
      // Simple check if page loaded correctly or if it's a valid notepad
      // MaiMemo might redirect or show error page if ID is invalid,
      // but for now we assume if title is missing something is wrong.
      // However, title could be empty. Let's check if we got a valid page structure.
      if ($("body").text().includes("404")) {
        throw new Error("Notepad not found");
      }
    }

    return {
      notepadId,
      title: title || "",
      brief: brief || "",
      contentList,
      isPrivacy,
      tags,
    };
  }

  /**
   * Save notepad data (Sync).
   */
  static async saveNotepad(
    cookie: string,
    detail: NotepadDetail,
    newContentList: string[]
  ): Promise<void> {
    const url = `${BASE_URL}/notepad/save`;
    const formData = new URLSearchParams();

    formData.append("id", detail.notepadId);
    formData.append("title", detail.title);
    formData.append("brief", detail.brief);
    formData.append("content", newContentList.join("\n"));
    formData.append("is_private", detail.isPrivacy.toString());

    detail.tags.forEach((tag) => {
      formData.append("tag[]", tag);
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...HEADERS,
        "content-type": "application/x-www-form-urlencoded",
        cookie: cookie,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.valid !== 1) {
      throw new Error(data.error || "Save failed");
    }
  }

  /**
   * Get phrase list.
   */
  static async getPhraseList(cookie: string, page: number = 1): Promise<any[]> {
    // offset=0 for page 1, offset=30 for page 2, etc.
    const offset = (page - 1) * 30;
    const url = `${BASE_URL}/custom/show/phrase?offset=${offset}&sort=created_time`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...HEADERS,
        cookie: cookie,
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const phrases: any[] = [];

    $("#phraseList li").each((_, el) => {
      const $el = $(el);
      const titleEl = $el.find(".cloud-title");
      const literaryEls = $el.find(".cloud-literary");

      const word = titleEl.text().trim();
      const editUrl = titleEl.find("a.edit").attr("href") || "";
      const id = new URLSearchParams(editUrl.split("?")[1]).get("id") || "";

      const sentence = $(literaryEls[0]).text().trim();
      const translation = $(literaryEls[1]).text().trim();

      if (word) {
        phrases.push({
          id,
          word,
          sentence,
          translation,
        });
      }
    });

    return phrases;
  }
}
