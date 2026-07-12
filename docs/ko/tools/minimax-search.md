---
read_when:
    - web_search에 MiniMax를 사용하려고 합니다
    - MiniMax Token Plan 키 또는 OAuth 토큰이 필요합니다.
    - MiniMax 중국/글로벌 검색 호스트에 대한 안내가 필요한 경우
summary: Token Plan 검색 API를 통한 MiniMax Search
title: MiniMax 검색
x-i18n:
    generated_at: "2026-07-12T01:16:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw는 MiniMax Token Plan 검색 API를 통해 MiniMax를 `web_search` 제공자로 지원합니다. 제목, URL, 요약문, 관련 검색어가 포함된 구조화된 검색 결과를 반환합니다.

## Token Plan 자격 증명 가져오기

<Steps>
  <Step title="키 생성">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)에서
    MiniMax Token Plan 키를 생성하거나 복사합니다.
    OAuth 설정에서는 대신 `MINIMAX_OAUTH_TOKEN`을 재사용할 수 있습니다.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`를 설정하거나 다음 명령으로 구성합니다.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw는 환경 변수 별칭으로 `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`,
`MINIMAX_API_KEY`도 허용하며, `MINIMAX_CODE_PLAN_KEY` 다음에 이 순서대로 확인합니다.
`MINIMAX_API_KEY`는 검색이 활성화된 Token Plan 자격 증명을 가리켜야 합니다.
일반 MiniMax 모델 API 키는 Token Plan 검색 엔드포인트에서 허용되지 않을 수 있습니다.

## 구성

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MiniMax Token Plan 환경 변수가 설정된 경우 선택 사항
            region: "global", // 또는 "cn"
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

**환경 변수 대안:** Gateway 환경에 `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`를 설정합니다.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣습니다.

## 리전 선택

MiniMax Search는 다음 엔드포인트를 사용합니다.

- 글로벌: `https://api.minimax.io/v1/coding_plan/search`
- 중국: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region`이 설정되지 않은 경우 OpenClaw는
다음 순서로 리전을 결정합니다.

1. `tools.web.search.minimax.region` / Plugin이 소유한 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

따라서 중국 리전 온보딩 또는 `MINIMAX_API_HOST=https://api.minimaxi.com/...` 설정은
MiniMax Search도 자동으로 중국 호스트를 계속 사용하도록 합니다.

OAuth `minimax-portal` 경로를 통해 MiniMax 인증을 완료한 경우에도 웹 검색은
여전히 제공자 ID `minimax`로 등록됩니다. OAuth 제공자의 기본 URL은 중국/글로벌
호스트 선택을 위한 리전 힌트로 사용되며, `MINIMAX_OAUTH_TOKEN`을 MiniMax Search의
Bearer 자격 증명으로 사용할 수 있습니다.

## 지원되는 매개변수

| 매개변수  | 유형    | 제약 조건       | 설명                                                                      |
| --------- | ------- | --------------- | ------------------------------------------------------------------------- |
| `query`   | 문자열  | 필수            | 검색 쿼리 문자열입니다.                                                   |
| `count`   | 정수    | 1~10, 기본값 5  | 반환할 결과 수입니다. OpenClaw는 반환된 목록을 이 크기에 맞게 잘라냅니다. |

현재 제공자별 필터는 지원되지 않습니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [MiniMax](/ko/providers/minimax) -- 모델, 이미지, 음성 및 인증 설정
