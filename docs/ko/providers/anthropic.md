---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려고 합니다
    - 페어링된 컴퓨터 간에 Claude CLI 또는 Claude Desktop 세션을 탐색하려고 합니다
summary: OpenClaw에서 API 키 또는 Claude CLI를 통해 Anthropic Claude 사용하기
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T15:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic은 **Claude** 모델 제품군을 개발합니다. OpenClaw은 두 가지 인증 경로를 지원합니다.

- **API 키** - 사용량 기반 결제를 사용하는 Anthropic API 직접 액세스(`anthropic/*` 모델)
- **Claude CLI** - 동일한 호스트의 기존 Claude Code 로그인을 재사용

## 사용량 및 비용 추적

OpenClaw은 사용 가능한 Anthropic 자격 증명을 감지하고 이에 맞는 사용량 화면을 선택합니다.

- Claude 구독/설정 자격 증명에는 할당량 기간과 선택적 추가 사용량 예산이 표시됩니다.
- `ANTHROPIC_ADMIN_KEY` 또는 `ANTHROPIC_ADMIN_API_KEY`를 사용하면 Control UI의 **사용량**에 공급자가 보고한 최근 30일간의 조직 비용과 Messages API 사용량이 표시됩니다. 여기에는 일별 지출, 토큰/캐시 합계, 주요 모델 및 비용 범주가 포함됩니다.
- Anthropic 공급자 프로필에 저장된 `sk-ant-admin...` 자격 증명은 Admin API 키로 자동 감지됩니다.

Admin API 비용 내역은 Anthropic의 [사용량 및 비용 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)에서 가져옵니다. 이는 OpenClaw이 세션을 기반으로 계산한 추정 비용과 별개인 실제 공급자 청구 금액입니다.

<Warning>
OpenClaw의 Claude CLI 백엔드는 설치된 Claude Code CLI를 비대화형 출력
모드(`claude -p`)로 실행합니다. Anthropic의 현재 Claude Code 문서에서는
이 모드를 Agent SDK/프로그래밍 방식 사용으로 설명합니다. Anthropic은 2026년
6월 15일 지원 업데이트에서 별도의 Agent SDK 결제 변경 발표를 보류했습니다.
Claude Agent SDK, `claude -p` 및 타사 앱 사용량은 여전히 로그인한 구독의
사용량 한도에서 차감되며, Anthropic이 해당 계획을 수정하는 동안에는 이전에
발표한 월간 Agent SDK 크레딧을 사용할 수 없습니다.

대화형 Claude Code도 로그인한 Claude 요금제의 한도에서 차감됩니다.
API 키 인증에는 해당 요금제와 무관한 사용량 기반 직접 결제가 적용됩니다.
장기간 실행되는 Gateway 호스트, 공유 자동화 및 예측 가능한 프로덕션
지출에는 Anthropic API 키를 사용하십시오.

Anthropic의 현재 지원 문서에 따라 OpenClaw 릴리스 없이도 이 동작이
변경될 수 있습니다.

- [Claude Code CLI 참조](https://code.claude.com/docs/en/cli-usage)
- [Claude 요금제에서 Claude Agent SDK 사용](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro 또는 Max 요금제에서 Claude Code 사용](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team 또는 Enterprise 요금제에서 Claude Code 사용](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code 비용 관리](https://code.claude.com/docs/en/costs)

</Warning>

## 시작하기

<Tabs>
  <Tab title="API 키">
    **적합한 용도:** 표준 API 액세스 및 사용량 기반 결제.

    <Steps>
      <Step title="API 키 발급">
        [Anthropic Console](https://console.anthropic.com/)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # 선택: Anthropic API 키
        ```

        또는 키를 직접 전달합니다.

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 구성 예시

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **적합한 용도:** 별도의 API 키 없이 기존 Claude CLI 로그인을 재사용.

    <Steps>
      <Step title="Claude CLI 설치 및 로그인 확인">
        다음 명령으로 확인합니다.

        ```bash
        claude --version
        ```
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # 선택: Claude CLI
        ```

        OpenClaw은 기존 Claude CLI 자격 증명을 감지하고 재사용합니다.
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 백엔드의 설정 및 런타임 세부 정보는 [CLI 백엔드](/ko/gateway/cli-backends)를 참조하십시오.
    </Note>

    <Warning>
    Claude CLI를 재사용하려면 OpenClaw 프로세스가 Claude CLI 로그인과
    동일한 호스트에서 실행되어야 합니다. Docker 설치에서는 컨테이너 홈을
    유지하고 그 안에서 Claude Code에 로그인할 수 있습니다. 자세한 내용은
    [Docker의 Claude CLI 백엔드](/ko/install/docker#claude-cli-backend-in-docker)를
    참조하십시오. [Podman](/ko/install/podman)과 같은 다른 컨테이너 설치에서는
    호스트의 `~/.claude`를 설정 또는 런타임에 마운트하지 않습니다. 이러한 환경에서는
    Anthropic API 키를 사용하거나 [OpenAI Codex](/ko/providers/openai)처럼
    OpenClaw 관리형 OAuth를 제공하는 공급자를 선택하십시오.
    </Warning>

    ### 구성 예시

    정식 Anthropic 모델 참조와 CLI 런타임 재정의를 함께 사용하는 것이 좋습니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    레거시 `claude-cli/claude-opus-4-7` 모델 참조도 호환성을 위해 계속
    작동하지만, 새 구성에서는 공급자/모델 선택에 `anthropic/*`을 사용하고
    실행 백엔드를 공급자/모델 런타임 정책에 지정해야 합니다.

    ### 결제 및 `claude -p`

    OpenClaw은 Claude CLI 실행에 Claude Code의 비대화형 `claude -p`
    경로를 사용합니다. Anthropic은 현재 이 경로를 Agent SDK/프로그래밍 방식
    사용으로 취급합니다.

    - Anthropic은 2026년 6월 15일 지원 업데이트에서 이전에 발표한
      별도의 Agent SDK 크레딧 계획을 보류했습니다.
    - 구독 요금제의 Claude Agent SDK, `claude -p` 및 타사 앱 사용량은
      여전히 로그인한 구독의 사용량 한도에서 차감됩니다.
    - Anthropic이 해당 계획을 수정하는 동안에는 이전에 발표한 월간
      Agent SDK 크레딧을 사용할 수 없습니다.
    - Console/API 키 로그인에는 사용량 기반 API 결제가 적용되며
      구독 Agent SDK 크레딧이 제공되지 않습니다.

    보류 공지는 Anthropic의 [Agent SDK 요금제
    문서](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)를
    참조하고, 구독 동작은 Claude Code 요금제 문서인
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    및
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)를
    참조하십시오.

    Anthropic은 OpenClaw 릴리스 없이 Claude Code의 결제 및 속도 제한
    동작을 변경할 수 있습니다. 결제 예측 가능성이 중요하다면
    `claude auth status`, `/status` 및 링크된 Anthropic 문서를 확인하십시오.

    <Tip>
    공유 프로덕션 자동화에는 Claude CLI 대신 Anthropic API 키를
    사용하십시오. OpenClaw은 [OpenAI Codex](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax) 및
    [Z.AI / GLM](/ko/providers/zai)의 구독형 옵션도 지원합니다.
    </Tip>

  </Tab>
</Tabs>

## 컴퓨터 간 Claude 세션

번들 Anthropic Plugin은 일반 세션 사이드바에 **Claude Code** 그룹을
추가합니다. 행은 일반 채팅 창에서 열립니다. Gateway와 연결된 Node
호스트에서 보관되지 않은 Claude Code 세션을 검색합니다.

- Claude CLI 세션은 유효한 프로젝트 인덱스 레코드와, 제한된 메타데이터
  접두사가 `~/.claude/projects/` 아래의 비사이드체인 `sdk-cli` 세션임을
  식별하는 현재 JSONL 파일에서 가져옵니다.
- Claude Desktop 세션은 메타데이터가 동일한 Claude Code 세션 ID를
  가리킬 때 Desktop 제목, 활동 시간 및 보관 상태를 사용합니다.
- CLI 전용 세션에는 보관 플래그가 없으므로 트랜스크립트가 존재하는 동안
  계속 표시됩니다.

추가 OpenClaw 구성은 필요하지 않습니다. Anthropic Plugin은 번들로
제공되며 기본적으로 활성화됩니다. 네이티브 macOS Node는 로컬
`~/.claude/projects/` 디렉터리가 존재할 때 읽기 전용 Claude 세션
명령을 알립니다. 이러한 명령이 처음 나타나면 Node 페어링 업그레이드를
승인하십시오.

사이드바는 각 호스트에서 제한된 최신 페이지로 시작하며 일반적인 30초
주기로 새로 고쳐집니다. 카탈로그 그룹 아래의 **세션 더 불러오기**를 사용하여
추가 기록이 있는 모든 호스트의 다음 페이지를 추가하십시오. 추가된 행은 계속
표시되며 새로 고칠 때도 동일한 깊이까지 다시 가져옵니다. 카탈로그 클라이언트는
`sessions.catalog.list`를 사용하며, 행을 열 때는 `sessions.catalog.read`를
사용합니다.

행을 선택하면 최신 트랜스크립트 페이지를 먼저 읽습니다. **이전 트랜스크립트
항목 불러오기**는 불투명 바이트 커서를 따라 전체 기록을 불러오는 대신 JSONL
파일에서 제한된 다른 구간을 읽습니다. 일반 사용자, 어시스턴트, 추론, 도구 호출
및 도구 결과 콘텐츠가 유지됩니다. Node/Gateway 안전 상한보다 큰 개별 항목은
잘린 것으로 명확하게 표시됩니다.

Gateway 로컬 `claude-cli` 행에서 일반 작성기에 입력하면
`sessions.catalog.continue`를 호출합니다. OpenClaw은 로컬 카탈로그 레코드를
다시 확인하고, 모델에 고정된 네이티브 세션을 생성하거나 재사용하며, 표시되는
항목을 최대 200개 또는 512 KiB까지 가져온 후 Claude CLI 바인딩을 초기화합니다.
첫 번째 턴은 `--fork-session`으로 재개됩니다. Claude는 포크에 새 세션 ID를
할당하므로 이후 턴에서는 포크를 사용하며 원본 세션은 변경되지 않습니다.
Claude Desktop 및 페어링된 Node의 행은 보기 전용입니다.

<Note>
페어링된 Node의 Claude 세션은 읽기 전용입니다. OpenClaw은 Claude Desktop
메타데이터를 수정하거나 Claude 세션을 보관하거나 소유 컴퓨터에서 두 번째
러너를 시작하지 않습니다. 두 Claude Node 명령 모두 읽기 전용이지만 이 페이지는
인증된 `node.invoke` 전송을 사용하므로 쓰기 범위가 있는 운영자 연결이 필요합니다.
</Note>

Node 명령 및 보안 경계에 관한 내용은 [Node: Claude 세션 및 트랜스크립트](/ko/nodes#claude-sessions-and-transcripts)를
참조하십시오.

## 사고 기본값(Claude Sonnet 5, Mythos 5, Fable 5, 4.8 및 4.6)

`anthropic/claude-sonnet-5`는 기본적으로 `high` 수준의 적응형 사고를 사용합니다.
사고를 비활성화하려면 `/think off`를 사용하고, 모델의 더 높은 네이티브 수준을
사용하려면 `/think xhigh|max`를 사용하십시오. Anthropic이 이 모델에서 해당 요청
기능을 지원하지 않으므로 OpenClaw은 Sonnet 5에 수동 사고 예산, 사용자 지정
샘플링 매개변수, 어시스턴트 프리필 및 Priority Tier를 사용하지 않습니다.
카탈로그에는 2026년 8월 31일까지 Anthropic의 출시 기념 입출력 가격인
`$2/$10`이 적용되며, 표준 `$3/$15` 가격은 2026년 9월 1일부터 적용됩니다.

`anthropic/claude-fable-5`는 항상 적응형 사고를 사용하며 기본 수준은 `high`입니다.
Anthropic은 이 모델의 사고 비활성화를 허용하지 않으므로 `/think off`와
`/think minimal`은 대신 `low` 수준에 매핑됩니다. Anthropic은 사고가 활성화된
모든 요청에서 temperature 재정의를 거부하므로 OpenClaw은 Fable 5 요청에서
사용자 지정 temperature 값도 사용하지 않습니다.

`anthropic/claude-mythos-5`는 동일한 상시 활성 적응형 사고 계약을 사용하는
제한 액세스 모델입니다. OpenClaw의 기본값은 `high`이고, `/think off`와
`/think minimal`을 `low`에 매핑하며, 호출자가 선택한 샘플링 매개변수를
사용하지 않습니다. 카탈로그에는 1,000,000토큰 컨텍스트 창, 128,000토큰 출력
한도, 이미지 입력 및 `$10/$50` 입출력 가격이 게시됩니다.

Claude Opus 4.8은 OpenClaw에서 기본적으로 사고가 비활성화되어 있습니다.
`/think high|xhigh|max`를 사용하여 적응형 사고를 명시적으로 활성화하면
OpenClaw은 Anthropic의 Opus 4.8 수준 값을 전송합니다. Claude 4.6 모델
(Opus 4.6 및 Sonnet 4.6)의 기본값은 `adaptive`입니다.

메시지별로 `/think:<level>`을 사용하거나 모델 매개변수에서 재정의하십시오.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
관련 Anthropic 문서:
- [적응형 사고](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [확장 사고](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 안전 거부 대체 동작(Claude Fable 5)

<Warning>
Claude Fable 5를 사용하면 Claude Opus 4.8도 함께 사용하게 됩니다. Fable 5에는
요청을 거부할 수 있는 안전 분류기가 포함되어 있으며, Anthropic이 승인한
복구 방법은 해당 턴을 `claude-opus-4-8`이 처리하도록 하는 것입니다. OpenClaw는
직접 API 키 요청에 대해 이를 자동으로 활성화하므로, 일부 Fable 턴은
Claude Opus 4.8이 응답하고 그 요금으로 청구됩니다. 정책이나 예산상
Opus가 처리하는 턴을 허용할 수 없다면 `anthropic/claude-fable-5`를
선택하지 마십시오.
</Warning>

### 이 기능이 존재하는 이유

Fable 5 분류기는 제한된 도메인의 요청에 `stop_reason: "refusal"`을 반환하며,
무해한 인접 작업(보안 도구, 생명과학 또는 모델에 원시
추론을 재현해 달라고 요청하는 경우까지)도 오탐합니다. 폴백이 없으면
다른 Claude 모델이 문제없이 처리할 수 있는데도 턴이 오류로 종료됩니다.
Anthropic 자체의 거부 메시지도 API 통합자에게 폴백 모델을 구성하라고
안내합니다.

### 작동 방식

1. `anthropic/claude-fable-5`로 보내는 모든 직접 API 키 요청에서 OpenClaw는
   Anthropic의 서버 측 폴백 옵트인을 전송합니다. 즉,
   `server-side-fallback-2026-06-01` 베타 헤더와
   `fallbacks: [{"model": "claude-opus-4-8"}]`를 전송합니다. Claude Opus 4.8은
   Anthropic이 Fable 5에 허용하는 유일한 폴백 대상입니다.
2. 안전 분류기의 거부만 폴백을 트리거합니다. 속도 제한,
   과부하 및 서버 오류는 이전과 정확히 동일하게 동작하며
   OpenClaw의 일반 [모델 페일오버](/ko/concepts/model-failover)를 거칩니다.
3. 복구는 동일한 호출 내에서 이루어집니다. 출력 전 거부는
   지연 시간 외에는 드러나지 않으며, 전체 답변은 Opus 4.8에서 생성됩니다.
   스트리밍 도중 거부되면 부분 텍스트는 폴백
   모델이 이어서 생성할 접두사로 유지되지만, 거부된 모델의 추론과 도구 호출은
   Anthropic의 재생 규칙에 따라 폐기됩니다(다시 에코하거나
   실행해서는 안 됩니다).
4. Claude Opus 4.8도 거부하면 이 기능을 사용하기 전과
   정확히 동일하게 턴에서 거부가 오류로 표시됩니다.

폴백은 Anthropic API 수준에서 이루어지므로 `claude-opus-4-8`을
구성된 모델 목록이나 폴백 체인에 포함할 필요가 없습니다. Fable을 사용할 수 있는
API 키는 언제든지 Opus를 처리할 수 있습니다.

### 관측 가능성과 청구

- 폴백으로 처리된 턴은 어시스턴트 메시지에 `fromModel`과 `toModel`을 명시하는
  `provider_fallback` 진단을 기록하며, 메시지의
  `responseModel`은 `claude-opus-4-8`을 보고합니다.
- Anthropic은 시도별로 요금을 청구합니다. 출력 전 거부는 무료이며, 복구에는
  Claude Opus 4.8 요금(현재 Fable 5 요금의 절반)이 청구됩니다. OpenClaw의
  턴별 비용 추정치는 이에 맞춰 폴백으로 처리된 턴을 Opus 요금으로 계산합니다.
- 스트리밍 도중 거부되면 Anthropic 측에서 이미 스트리밍된 Fable 부분에 대한
  요금도 추가로 청구됩니다. 해당 부분은 API의 시도별
  사용량에 보고되지만 OpenClaw의 턴별 추정치에는 포함되지 않습니다.

### 적용 범위

`api.anthropic.com`을 대상으로 API 키 인증을 사용하는
`anthropic/claude-fable-5`에 적용됩니다. OAuth(Claude CLI 구독 재사용), 프록시 기준 URL,
Bedrock, Vertex 및 Foundry 요청은 변경되지 않으며 해당 환경에서는 계속
거부가 오류로 표시됩니다.

실시간 검증 결과: Fable 5에 원시 사고 과정을 재현하도록 요청하는 무해한 프롬프트를
폴백 없이 전송하면 `category: "reasoning_extraction"`으로 거부되지만,
동일한 프롬프트를 OpenClaw를 통해 전송하면 `provider_fallback` 진단이 첨부된
정상적인 Opus 처리 답변이 반환됩니다.

기본 동작은 Anthropic의 [거부 및 폴백
가이드](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)를
참조하십시오.

## 프롬프트 캐싱

OpenClaw는 API 키 인증에 Anthropic의 프롬프트 캐싱 기능을 지원합니다.

| 값                  | 캐시 기간       | 설명                                |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (기본값) | 5분            | API 키 인증에 자동으로 적용됩니다 |
| `"long"`            | 1시간          | 확장 캐시                         |
| `"none"`            | 캐싱 없음      | 프롬프트 캐싱을 비활성화합니다                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="에이전트별 캐시 재정의">
    모델 수준 매개변수를 기준선으로 사용한 다음 `agents.list[].params`를 통해 특정 에이전트에 대해 재정의하십시오.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    구성 병합 순서:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id`가 일치하며 키별로 재정의)

    이를 통해 한 에이전트는 장기 캐시를 유지하면서 동일한 모델을 사용하는 다른 에이전트는 버스트성/재사용률이 낮은 트래픽에 대해 캐싱을 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Bedrock Claude 참고 사항">
    - Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 구성된 경우 `cacheRetention` 전달을 허용합니다.
    - Anthropic 이외의 Bedrock 모델은 런타임에 `cacheRetention: "none"`으로 강제 설정됩니다.
    - 명시적 값이 설정되지 않은 경우 API 키 스마트 기본값은 Bedrock 기반 Claude 참조에도 `cacheRetention: "short"`를 초기값으로 설정합니다.

  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="고속 모드">
    OpenClaw의 공유 `/fast` 토글은 `api.anthropic.com`으로 직접 보내는 API 키 트래픽에 대해 Anthropic의 `service_tier` 필드를 설정합니다.

    | 명령 | 매핑 대상 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - API 키로 직접 수행하는 `api.anthropic.com` 요청에만 적용됩니다. OAuth/구독 토큰 요청과 프록시 경로에는 `service_tier` 필드가 추가되지 않습니다.
    - 명시적인 `serviceTier` 또는 `service_tier` 매개변수가 설정된 경우 `/fast`보다 우선합니다.
    - Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 `standard`로 결정될 수 있습니다.

    </Note>

  </Accordion>

  <Accordion title="미디어 이해(이미지 및 PDF)">
    번들 Anthropic Plugin은 이미지 및 PDF 이해 기능을 등록합니다. OpenClaw는
    구성된 Anthropic 인증에서 미디어 기능을 자동으로 확인하므로
    추가 구성이 필요하지 않습니다.

    | 속성            | 값                    |
    | --------------- | --------------------- |
    | 기본 모델       | `claude-opus-4-8`     |
    | 지원 입력       | 이미지, PDF 문서      |

    이미지나 PDF가 대화에 첨부되면 OpenClaw는 자동으로
    Anthropic 미디어 이해 공급자를 통해 이를 라우팅합니다.

  </Accordion>

  <Accordion title="1M 컨텍스트 창">
    Claude Sonnet 5, Mythos 5 및 Fable 5는 정확히 1,000,000토큰의 입력
    창을 제공하며 최대 128,000개의 출력 토큰을 지원합니다. Anthropic의 1M 컨텍스트
    창은 적응형 사고를 사용하는 Claude 4.x 모델에서도 GA 상태입니다. 해당 모델은 Opus 4.8,
    Opus 4.7, Opus 4.6 및 Sonnet 4.6입니다. OpenClaw는 이러한 모델의 크기를
    자동으로 설정하므로 `params.context1m`이 필요하지 않습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    이전 구성에서는 `params.context1m: true`를 유지할 수 있습니다. 이는
    이러한 모델에서 아무 영향이 없는 무해한 설정이며, OpenClaw는 이제 어떤 경우에도 폐기된
    `context-1m-2025-08-07` 베타 헤더를 전송하지 않습니다. 해당 값이 포함된 이전 `anthropicBeta` 구성
    항목은 요청 헤더 확인 과정에서 제거되며,
    지원되지 않는 이전 Claude 모델은 일반 컨텍스트 창을 유지합니다.

    `params.context1m: true`는 Claude CLI 백엔드
    (`claude-cli/*`)에서도 동일하게 동작합니다. GA 기능을 지원하는 적격 Opus 및 Sonnet 모델은 이미
    1M 창을 자동으로 사용하므로 해당 매개변수는 이 환경에서도 선택 사항입니다.

    <Warning>
    Anthropic 자격 증명에 긴 컨텍스트 접근 권한이 필요합니다. OAuth/구독 토큰 인증은 필요한 Anthropic 베타 헤더를 유지하지만, OpenClaw는 이전 구성에 폐기된 1M 베타 헤더가 남아 있으면 이를 제거합니다.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 컨텍스트">
    `anthropic/claude-opus-4-8` 및 그 `claude-cli` 변형은 기본적으로 1M 컨텍스트
    창을 사용하므로 `params.context1m: true`가 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="401 오류/토큰이 갑자기 유효하지 않음">
    Anthropic 토큰 인증은 만료될 수 있으며 철회될 수도 있습니다. 새로 설정하는 경우에는 Anthropic API 키를 대신 사용하십시오.
  </Accordion>

  <Accordion title='공급자 "anthropic"의 API 키를 찾을 수 없음'>
    Anthropic 인증은 **에이전트별**입니다. 새 에이전트는 주 에이전트의 키를 상속하지 않습니다. 해당 에이전트에 대해 온보딩을 다시 실행하거나 Gateway 호스트에서 API 키를 구성한 다음 `openclaw models status`로 확인하십시오.
  </Accordion>

  <Accordion title='프로필 "anthropic:default"의 자격 증명을 찾을 수 없음'>
    `openclaw models status`를 실행하여 활성 인증 프로필을 확인하십시오. 온보딩을 다시 실행하거나 해당 프로필 경로에 API 키를 구성하십시오.
  </Accordion>

  <Accordion title="사용 가능한 인증 프로필 없음(모두 쿨다운 중)">
    `openclaw models status --json`에서 `auth.unusableProfiles`를 확인하십시오. Anthropic 속도 제한 쿨다운은 모델별로 적용될 수 있으므로 다른 Anthropic 모델은 여전히 사용할 수 있습니다. 다른 Anthropic 프로필을 추가하거나 쿨다운이 끝날 때까지 기다리십시오.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [자주 묻는 질문](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조 및 페일오버 동작을 선택하는 방법입니다.
  </Card>
  <Card title="CLI 백엔드" href="/ko/gateway/cli-backends" icon="terminal">
    Claude CLI 백엔드 설정 및 런타임 세부 정보입니다.
  </Card>
  <Card title="프롬프트 캐싱" href="/ko/reference/prompt-caching" icon="database">
    공급자 전반에서 프롬프트 캐싱이 작동하는 방식입니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙입니다.
  </Card>
</CardGroup>
