---
read_when:
    - MiniMax를 web_search에 사용하려고 합니다
    - MiniMax Token Plan 키 또는 OAuth 토큰이 필요합니다
    - MiniMax CN/글로벌 검색 호스트 지침이 필요합니다
summary: Token Plan 검색 API를 통한 MiniMax 검색
title: MiniMax 검색
x-i18n:
    generated_at: "2026-05-11T20:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw는 MiniMax Token Plan 검색 API를 통해 MiniMax를 `web_search` 제공자로 지원합니다. 이 API는 제목, URL,
스니펫, 관련 쿼리가 포함된 구조화된 검색 결과를 반환합니다.

## Token Plan 자격 증명 받기

<Steps>
  <Step title="키 만들기">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)에서
    MiniMax Token Plan 키를 만들거나 복사합니다.
    OAuth 설정은 대신 `MINIMAX_OAUTH_TOKEN`을 재사용할 수 있습니다.
  </Step>
  <Step title="키 저장하기">
    Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`를 설정하거나, 다음으로 구성합니다.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw는 env 별칭으로 `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, 그리고
`MINIMAX_API_KEY`도 허용합니다. `MINIMAX_API_KEY`는
검색이 활성화된 Token Plan 자격 증명을 가리켜야 합니다. 일반 MiniMax 모델 API 키는
Token Plan 검색 엔드포인트에서 허용되지 않을 수 있습니다.

## 구성

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**환경 대안:** Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`를 설정합니다.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣습니다.

## 지역 선택

MiniMax Search는 다음 엔드포인트를 사용합니다.

- 글로벌: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region`이 설정되지 않은 경우 OpenClaw는
다음 순서로 지역을 결정합니다.

1. `tools.web.search.minimax.region` / Plugin 소유 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

즉, CN 온보딩 또는 `MINIMAX_API_HOST=https://api.minimaxi.com/...`는
MiniMax Search도 자동으로 CN 호스트에 유지되도록 합니다.

OAuth `minimax-portal` 경로를 통해 MiniMax 인증을 했더라도,
웹 검색은 여전히 제공자 id `minimax`로 등록됩니다. OAuth 제공자 기본 URL은
CN/글로벌 호스트 선택을 위한 지역 힌트로 사용되며, `MINIMAX_OAUTH_TOKEN`은
MiniMax Search bearer 자격 증명을 충족할 수 있습니다.

## 지원되는 매개변수

| 매개변수 | 유형    | 제약 조건 | 설명                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | required    | 검색 쿼리 문자열.                                                        |
| `count`   | integer | 1-10        | 반환할 결과 수. OpenClaw는 반환된 목록을 이 크기로 잘라냅니다. |

제공자별 필터는 현재 지원되지 않습니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자와 자동 감지
- [MiniMax](/ko/providers/minimax) -- 모델, 이미지, 음성, 인증 설정
