import { NextRequest } from "next/server";

type School = {
  name: string;
  address: string;
  officeName: string;
  officeCode: string;
  schoolCode: string;
  type: string;
  source?: "NEIS" | "LOCAL" | "DIRECT";
};

type NeisSchoolRow = {
  ATPT_OFCDC_SC_CODE?: string;
  ATPT_OFCDC_SC_NM?: string;
  SD_SCHUL_CODE?: string;
  SCHUL_NM?: string;
  ORG_RDNMA?: string;
  SCHUL_KND_SC_NM?: string;
};

const localSchools: School[] = [
  makeLocalSchool("전남과학고등학교", "전라남도 나주시 금천면", "전라남도교육청", "Q10", "고등학교"),
  makeLocalSchool("서울고등학교", "서울특별시 서초구", "서울특별시교육청", "B10", "고등학교"),
  makeLocalSchool("경기고등학교", "서울특별시 강남구", "서울특별시교육청", "B10", "고등학교"),
  makeLocalSchool("한성과학고등학교", "서울특별시 서대문구", "서울특별시교육청", "B10", "고등학교"),
  makeLocalSchool("세종과학고등학교", "서울특별시 구로구", "서울특별시교육청", "B10", "고등학교"),
  makeLocalSchool("부산과학고등학교", "부산광역시 금정구", "부산광역시교육청", "C10", "고등학교"),
  makeLocalSchool("대구과학고등학교", "대구광역시 수성구", "대구광역시교육청", "D10", "영재학교"),
  makeLocalSchool("인천과학고등학교", "인천광역시 중구", "인천광역시교육청", "E10", "고등학교"),
  makeLocalSchool("광주과학고등학교", "광주광역시 북구", "광주광역시교육청", "F10", "영재학교"),
  makeLocalSchool("대전과학고등학교", "대전광역시 유성구", "대전광역시교육청", "G10", "영재학교"),
  makeLocalSchool("울산과학고등학교", "울산광역시 울주군", "울산광역시교육청", "H10", "고등학교"),
  makeLocalSchool("경기과학고등학교", "경기도 수원시", "경기도교육청", "J10", "영재학교"),
  makeLocalSchool("강원과학고등학교", "강원특별자치도 원주시", "강원특별자치도교육청", "K10", "고등학교"),
  makeLocalSchool("충북과학고등학교", "충청북도 청주시", "충청북도교육청", "M10", "고등학교"),
  makeLocalSchool("충남과학고등학교", "충청남도 공주시", "충청남도교육청", "N10", "고등학교"),
  makeLocalSchool("전북과학고등학교", "전북특별자치도 익산시", "전북특별자치도교육청", "P10", "고등학교"),
  makeLocalSchool("경북과학고등학교", "경상북도 포항시", "경상북도교육청", "R10", "고등학교"),
  makeLocalSchool("경남과학고등학교", "경상남도 진주시", "경상남도교육청", "S10", "고등학교"),
  makeLocalSchool("제주과학고등학교", "제주특별자치도 제주시", "제주특별자치도교육청", "T10", "고등학교"),
  makeLocalSchool("목포고등학교", "전라남도 목포시", "전라남도교육청", "Q10", "고등학교"),
  makeLocalSchool("목포중학교", "전라남도 목포시", "전라남도교육청", "Q10", "중학교"),
  makeLocalSchool("순천고등학교", "전라남도 순천시", "전라남도교육청", "Q10", "고등학교"),
  makeLocalSchool("순천중학교", "전라남도 순천시", "전라남도교육청", "Q10", "중학교"),
  makeLocalSchool("여수고등학교", "전라남도 여수시", "전라남도교육청", "Q10", "고등학교"),
  makeLocalSchool("여수중학교", "전라남도 여수시", "전라남도교육청", "Q10", "중학교"),
  makeLocalSchool("나주고등학교", "전라남도 나주시", "전라남도교육청", "Q10", "고등학교"),
  makeLocalSchool("나주중학교", "전라남도 나주시", "전라남도교육청", "Q10", "중학교"),
  makeLocalSchool("광주고등학교", "광주광역시 동구", "광주광역시교육청", "F10", "고등학교"),
  makeLocalSchool("광주중학교", "광주광역시", "광주광역시교육청", "F10", "중학교"),
  makeLocalSchool("대전고등학교", "대전광역시 중구", "대전광역시교육청", "G10", "고등학교"),
  makeLocalSchool("대전중학교", "대전광역시", "대전광역시교육청", "G10", "중학교"),
  makeLocalSchool("부산고등학교", "부산광역시 동구", "부산광역시교육청", "C10", "고등학교"),
  makeLocalSchool("부산중학교", "부산광역시", "부산광역시교육청", "C10", "중학교"),
  makeLocalSchool("제주제일고등학교", "제주특별자치도 제주시", "제주특별자치도교육청", "T10", "고등학교"),
  makeLocalSchool("제주중앙중학교", "제주특별자치도 제주시", "제주특별자치도교육청", "T10", "중학교")
];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json({ schools: localSchools.slice(0, 8), source: "LOCAL" });
  }

  const neisResults = await searchNeisSchools(query);
  const localResults = searchLocalSchools(query);
  const directResults = makeDirectSchools(query);
  const schools = mergeSchools([...neisResults, ...localResults, ...directResults]);

  return Response.json({
    schools: schools.slice(0, 16),
    source: neisResults.length ? "NEIS" : "LOCAL"
  });
}

async function searchNeisSchools(query: string): Promise<School[]> {
  const key = process.env.NEIS_API_KEY?.trim();
  if (!key) return [];

  const variants = getSchoolNameVariants(query).slice(0, 4);
  const results = await Promise.all(variants.map((variant) => fetchNeisSchools(variant, key)));
  return mergeSchools(results.flat());
}

async function fetchNeisSchools(query: string, key: string): Promise<School[]> {
  const endpoint = new URL("https://open.neis.go.kr/hub/schoolInfo");
  endpoint.searchParams.set("KEY", key);
  endpoint.searchParams.set("Type", "json");
  endpoint.searchParams.set("pIndex", "1");
  endpoint.searchParams.set("pSize", "20");
  endpoint.searchParams.set("SCHUL_NM", query);

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 60 * 60 * 24 }
    });
    if (!response.ok) return [];

    const data = await response.json();
    if (data.RESULT) return [];

    const rows = (data.schoolInfo?.[1]?.row ?? []) as NeisSchoolRow[];
    return rows
      .map((row) => ({
        name: row.SCHUL_NM ?? "",
        address: row.ORG_RDNMA ?? "",
        officeName: row.ATPT_OFCDC_SC_NM ?? "",
        officeCode: row.ATPT_OFCDC_SC_CODE ?? "",
        schoolCode: row.SD_SCHUL_CODE ?? "",
        type: row.SCHUL_KND_SC_NM ?? "",
        source: "NEIS" as const
      }))
      .filter((school) => school.name);
  } catch {
    return [];
  }
}

function searchLocalSchools(query: string) {
  const normalizedQuery = normalize(query);
  const normalizedVariants = getSchoolNameVariants(query).map(normalize);
  return localSchools
    .map((school) => ({
      school,
      score: scoreSchool(school.name, normalizedQuery, normalizedVariants)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name, "ko"))
    .map((item) => item.school);
}

function scoreSchool(name: string, normalizedQuery: string, normalizedVariants: string[]) {
  const normalizedName = normalize(name);
  if (normalizedVariants.includes(normalizedName)) return 100;
  if (normalizedVariants.some((variant) => normalizedName.startsWith(variant))) return 85;
  if (normalizedName.startsWith(normalizedQuery)) return 80;
  if (normalizedVariants.some((variant) => normalizedName.includes(variant))) return 65;
  if (normalizedName.includes(normalizedQuery)) return 55;
  return 0;
}

function makeDirectSchools(query: string): School[] {
  return getDirectSchoolNameVariants(query).map((name) => ({
    name,
    address: "직접 입력",
    officeName: "직접 선택",
    officeCode: "DIRECT",
    schoolCode: `DIRECT-${normalize(name)}`,
    type: inferSchoolType(name),
    source: "DIRECT"
  }));
}

function getDirectSchoolNameVariants(query: string) {
  const clean = query.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  if (/(초등학교|중학교|고등학교|학교)$/.test(clean)) return [clean];
  if (/초$/.test(clean)) return [`${clean}등학교`];
  if (/중$/.test(clean)) return [`${clean}학교`];
  if (/고$/.test(clean)) return [`${clean}등학교`];
  return unique([`${clean}중학교`, `${clean}고등학교`, `${clean}학교`]);
}

function getSchoolNameVariants(query: string) {
  const clean = query.trim().replace(/\s+/g, " ");
  if (!clean) return [];

  const variants = [clean];
  if (/(초등학교|중학교|고등학교|학교)$/.test(clean)) return unique(variants);
  if (/초$/.test(clean)) variants.push(`${clean}등학교`);
  if (/중$/.test(clean)) variants.push(`${clean}학교`);
  if (/고$/.test(clean)) variants.push(`${clean}등학교`);

  if (!/(초|중|고)$/.test(clean)) {
    variants.push(`${clean}중학교`, `${clean}고등학교`, `${clean}학교`);
  }

  return unique(variants);
}

function inferSchoolType(name: string) {
  if (name.includes("초등학교")) return "초등학교";
  if (name.includes("중학교")) return "중학교";
  if (name.includes("고등학교")) return "고등학교";
  return "학교";
}

function mergeSchools(schools: School[]) {
  const seen = new Set<string>();
  const merged: School[] = [];
  for (const school of schools) {
    const key = normalize(`${school.officeCode}-${school.schoolCode}-${school.name}`);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(school);
  }
  return merged;
}

function makeLocalSchool(
  name: string,
  address: string,
  officeName: string,
  officeCode: string,
  type: string
): School {
  return {
    name,
    address,
    officeName,
    officeCode,
    schoolCode: "",
    type,
    source: "LOCAL"
  };
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
