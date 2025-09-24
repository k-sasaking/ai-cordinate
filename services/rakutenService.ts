// rakutenClothing.ts
export type Gender = "男性" | "女性";

export interface RakutenClothingResult {
  imageUrl: string;
  itemUrl: string;
  itemName: string;
  itemCaption: string;
}

interface Options {
  hits?: number; // 1-30件（デフォルト30）
  keyword?: string; // 任意の検索ワード
  sort?: string; // 並び順（例: "-reviewCount"）
}

/**
 * 性別・年齢・ページ数を指定して洋服カテゴリの商品画像とURLを検索
 */
export async function searchRakutenClothingImages(
  gender: string,
  age: number,
  page: number,
  options: Options = {}
): Promise<RakutenClothingResult[]> {
  const applicationId = process.env.RAKUTEN_APP_ID;
  if (!applicationId) throw new Error("applicationId is required");

  // 年齢×性別からジャンルIDを決定
  const genreId =
    age <= 12
      ? 100533 // キッズ
      : gender === "男性"
      ? 551177 // メンズ
      : 100371; // レディース

  const { hits = 30, keyword, sort } = options;

  const params = new URLSearchParams({
    applicationId,
    format: "json",
    formatVersion: "2",
    genreId: String(genreId),
    imageFlag: "1", // 画像あり
    availability: "1", // 在庫あり
    hits: String(Math.min(Math.max(hits, 1), 30)),
    page: String(Math.min(Math.max(page, 1), 100)),
  });

  if (keyword) params.set("keyword", keyword);
  if (sort) params.set("sort", sort);

  const endpoint =
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

  const res = await fetch(`${endpoint}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Rakuten API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  console.log(data);

  const items = Array.isArray(data["Items"]) ? data["Items"] : [];

  // mediumImageUrls/smallImageUrls のどちらでも対応
  const toUrlArray = (arr: any): string[] =>
    Array.isArray(arr)
      ? arr
          .map((x) => (typeof x === "string" ? x : x?.imageUrl))
          .filter((u: unknown): u is string => typeof u === "string")
      : [];

  // 返却値は imageUrl と itemUrl のみ
  const results: RakutenClothingResult[] = [];
  items.forEach((it: any) => {
    const urls =
      toUrlArray(it.mediumImageUrls).length > 0
        ? toUrlArray(it.mediumImageUrls)
        : toUrlArray(it.smallImageUrls);
    results.push({
      imageUrl: urls[0],
      itemUrl: it.itemUrl,
      itemName: it.itemName,
      itemCaption: it.itemCaption,
    });
    // urls.forEach((url) => {
    //   results.push({
    //     imageUrl: url,
    //     itemUrl: it.itemUrl,
    //   });
    // });
  });

  return results;
}
