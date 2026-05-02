---
read_when:
    - web_search에 Kimi를 사용하려고 합니다
    - KIMI_API_KEY 또는 MOONSHOT_API_KEY가 필요합니다
summary: Moonshot 웹 검색을 통한 Kimi 웹 검색
title: Kimi 검색
x-i18n:
    generated_at: "2026-05-02T21:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw는 Moonshot 웹 검색을 사용해 인용이 포함된 AI 합성 답변을 생성하는 `web_search` 제공자로 Kimi를 지원합니다.

## API 키 받기

<Steps>
  <Step title="키 만들기">
    [Moonshot AI](https://platform.moonshot.cn/)에서 API 키를 받습니다.
  </Step>
  <Step title="키 저장하기">
    Gateway 환경에서 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 설정하거나, 다음으로 구성합니다.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Kimi**를 선택하면 OpenClaw가 다음 항목도 요청할 수 있습니다.

- Moonshot API 리전:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 기본 Kimi 웹 검색 모델(기본값은 `kimi-k2.6`)

## 구성

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

채팅에 중국 API 호스트(`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`)를 사용하는 경우, `tools.web.search.kimi.baseUrl`이 생략되면 OpenClaw는 Kimi `web_search`에도 동일한 호스트를 재사용하므로 [platform.moonshot.cn](https://platform.moonshot.cn/)의 키가 실수로 국제 엔드포인트에 도달하지 않습니다(이 경우 HTTP 401이 자주 반환됨). 다른 검색 기본 URL이 필요할 때는 `tools.web.search.kimi.baseUrl`로 재정의하세요.

**환경 대안:** Gateway 환경에서 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 설정합니다. Gateway 설치의 경우 `~/.openclaw/.env`에 넣습니다.

`baseUrl`을 생략하면 OpenClaw의 기본값은 `https://api.moonshot.ai/v1`입니다.
`model`을 생략하면 OpenClaw의 기본값은 `kimi-k2.6`입니다.

## 작동 방식

Kimi는 Gemini 및 Grok의 그라운딩된 응답 접근 방식과 유사하게, Moonshot 웹 검색을 사용해 인라인 인용이 포함된 답변을 합성합니다.

OpenClaw는 재생 가능한 `$web_search` 도구 페이로드, `search_results` 또는 인용 URL 같은 네이티브 웹 검색 그라운딩 증거가 Moonshot에서 반환된 후에만 Kimi `web_search`를 성공으로 처리합니다. Kimi가 그라운딩 증거 없이 "I cannot browse the internet" 같은 일반 채팅 답변으로 즉시 중단되면, OpenClaw는 해당 텍스트를 검색 결과로 감싸는 대신 구조화된 `kimi_web_search_ungrounded` 오류를 반환합니다. 쿼리를 다시 시도하거나, Brave 같은 구조화된 제공자로 전환하거나, 대상 URL이 이미 있는 경우 `web_fetch` / 브라우저 도구를 사용하세요.

## 지원되는 매개변수

Kimi 검색은 `query`를 지원합니다.

`count`는 공유 `web_search` 호환성을 위해 허용되지만, Kimi는 여전히 N개 결과 목록이 아니라 인용이 포함된 하나의 합성 답변을 반환합니다.

제공자별 필터는 현재 지원되지 않습니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Moonshot AI](/ko/providers/moonshot) -- Moonshot 모델 + Kimi Coding 제공자 문서
- [Gemini 검색](/ko/tools/gemini-search) -- Google 그라운딩을 통한 AI 합성 답변
- [Grok 검색](/ko/tools/grok-search) -- xAI 그라운딩을 통한 AI 합성 답변
