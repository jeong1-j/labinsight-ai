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
  { name: "전남과학고등학교", address: "전라남도 나주시 금천면", officeName: "전라남도교육청", officeCode: "Q10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "서울고등학교", address: "서울특별시 서초구", officeName: "서울특별시교육청", officeCode: "B10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "경기고등학교", address: "서울특별시 강남구", officeName: "서울특별시교육청", officeCode: "B10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "한성과학고등학교", address: "서울특별시 서대문구", officeName: "서울특별시교육청", officeCode: "B10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "세종과학고등학교", address: "서울특별시 구로구", officeName: "서울특별시교육청", officeCode: "B10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "부산과학고등학교", address: "부산광역시 금정구", officeName: "부산광역시교육청", officeCode: "C10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "부산일과학고등학교", address: "부산광역시 사하구", officeName: "부산광역시교육청", officeCode: "C10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "한국과학영재학교", address: "부산광역시 부산진구", officeName: "부산광역시교육청", officeCode: "C10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "대구과학고등학교", address: "대구광역시 수성구", officeName: "대구광역시교육청", officeCode: "D10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "인천과학고등학교", address: "인천광역시 중구", officeName: "인천광역시교육청", officeCode: "E10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "인천진산과학고등학교", address: "인천광역시 부평구", officeName: "인천광역시교육청", officeCode: "E10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "광주과학고등학교", address: "광주광역시 북구", officeName: "광주광역시교육청", officeCode: "F10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "대전과학고등학교", address: "대전광역시 유성구", officeName: "대전광역시교육청", officeCode: "G10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "대전동신과학고등학교", address: "대전광역시 동구", officeName: "대전광역시교육청", officeCode: "G10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "울산과학고등학교", address: "울산광역시 울주군", officeName: "울산광역시교육청", officeCode: "H10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "세종과학예술영재학교", address: "세종특별자치시", officeName: "세종특별자치시교육청", officeCode: "I10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "경기과학고등학교", address: "경기도 수원시", officeName: "경기도교육청", officeCode: "J10", schoolCode: "", type: "영재학교", source: "LOCAL" },
  { name: "경기북과학고등학교", address: "경기도 의정부시", officeName: "경기도교육청", officeCode: "J10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "강원과학고등학교", address: "강원특별자치도 원주시", officeName: "강원특별자치도교육청", officeCode: "K10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "충북과학고등학교", address: "충청북도 청주시", officeName: "충청북도교육청", officeCode: "M10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "충남과학고등학교", address: "충청남도 공주시", officeName: "충청남도교육청", officeCode: "N10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "전북과학고등학교", address: "전북특별자치도 익산시", officeName: "전북특별자치도교육청", officeCode: "P10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "경북과학고등학교", address: "경상북도 포항시", officeName: "경상북도교육청", officeCode: "R10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "경산과학고등학교", address: "경상북도 경산시", officeName: "경상북도교육청", officeCode: "R10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "경남과학고등학교", address: "경상남도 진주시", officeName: "경상남도교육청", officeCode: "S10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "창원과학고등학교", address: "경상남도 창원시", officeName: "경상남도교육청", officeCode: "S10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "제주과학고등학교", address: "제주특별자치도 제주시", officeName: "제주특별자치도교육청", officeCode: "T10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "민족사관고등학교", address: "강원특별자치도 횡성군", officeName: "강원특별자치도교육청", officeCode: "K10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "하나고등학교", address: "서울특별시 은평구", officeName: "서울특별시교육청", officeCode: "B10", schoolCode: "", type: "고등학교", source: "LOCAL" },
  { name: "상산고등학교", address: "전북특별자치도 전주시", officeName: "전북특별자치도교육청", officeCode: "P10", schoolCode: "", type: "고등학교", source: "LOCAL" }
];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return Response.json({ schools: localSchools.slice(0, 8), source: "LOCAL" });
  }

  const localResults = searchLocalSchools(query);
  const neisResults = await searchNeisSchools(query);
  const schools = mergeSchools([...neisResults, ...localResults]);

  const directName = withSchoolSuffix(query);
  if (!schools.length) {
    schools.push(makeDirectSchool(query));
  } else if (!schools.some((school) => normalize(school.name) === normalize(query) || normalize(school.name) === normalize(directName))) {
    schools.push(makeDirectSchool(query));
  }

  return Response.json({
    schools: schools.slice(0, 12),
    source: neisResults.length ? "NEIS" : "LOCAL"
  });
}

async function searchNeisSchools(query: string): Promise<School[]> {
  const key = process.env.NEIS_API_KEY?.trim();
  if (!key) return [];

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
  const looseQuery = normalize(withSchoolSuffix(query));
  return localSchools
    .map((school) => ({
      school,
      score: scoreSchool(school.name, normalizedQuery, looseQuery)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name, "ko"))
    .map((item) => item.school);
}

function scoreSchool(name: string, normalizedQuery: string, looseQuery: string) {
  const normalizedName = normalize(name);
  if (normalizedName === normalizedQuery || normalizedName === looseQuery) return 100;
  if (normalizedName.startsWith(normalizedQuery)) return 80;
  if (normalizedName.includes(normalizedQuery)) return 60;
  if (normalizedQuery.length <= 3 && normalizedQuery.includes("과학") && normalizedName.includes("과학")) return 20;
  return 0;
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

function makeDirectSchool(query: string): School {
  return {
    name: withSchoolSuffix(query),
    address: "직접 입력",
    officeName: "직접 선택",
    officeCode: "",
    schoolCode: "",
    type: "학교",
    source: "DIRECT"
  };
}

function withSchoolSuffix(query: string) {
  if (/(초등학교|중학교|고등학교|학교)$/.test(query)) return query;
  if (/고$/.test(query)) return `${query}등학교`;
  return query;
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
