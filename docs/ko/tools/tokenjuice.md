---
read_when:
    - OpenClaw에서 더 짧은 `exec` 또는 `bash` 도구 결과를 원합니다
    - Tokenjuice Plugin을 설치하거나 활성화하려고 합니다
    - 토큰주스가 무엇을 변경하고 무엇을 원시 상태로 남겨 두는지 이해해야 합니다
summary: 선택 사항인 Tokenjuice Plugin으로 잡음 많은 exec 및 bash 도구 결과 압축하기
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:17:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice`는 명령이 이미 실행된 후 노이즈가 많은 `exec` 및 `bash`
도구 결과를 압축하는 선택적 외부 Plugin입니다.

명령 자체가 아니라 반환되는 `tool_result`를 변경합니다. Tokenjuice는
셸 입력을 다시 쓰거나, 명령을 다시 실행하거나, 종료 코드를 변경하지 않습니다.

현재 이는 Codex 앱 서버 하네스의 OpenClaw 임베디드 실행 및 OpenClaw 동적 도구에
적용됩니다. Tokenjuice는 OpenClaw의 도구 결과 미들웨어에 연결되어
출력이 활성 하네스 세션으로 돌아가기 전에 잘라냅니다.

## Plugin 활성화

한 번 설치합니다.

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

그런 다음 활성화합니다.

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

동등한 명령:

```bash
openclaw plugins enable tokenjuice
```

설정을 직접 편집하고 싶다면:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice가 변경하는 것

- 노이즈가 많은 `exec` 및 `bash` 결과가 세션으로 다시 전달되기 전에 압축합니다.
- 원래 명령 실행은 그대로 둡니다.
- 정확한 파일 콘텐츠 읽기와 tokenjuice가 원본 그대로 두어야 하는 다른 명령을 보존합니다.
- 옵트인 상태를 유지합니다. 모든 곳에서 원문 그대로의 출력을 원하면 Plugin을 비활성화하세요.

## 작동 여부 확인

1. Plugin을 활성화합니다.
2. `exec`를 호출할 수 있는 세션을 시작합니다.
3. `git status`와 같은 노이즈가 많은 명령을 실행합니다.
4. 반환된 도구 결과가 원시 셸 출력보다 더 짧고 구조화되어 있는지 확인합니다.

## Plugin 비활성화

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

또는:

```bash
openclaw plugins disable tokenjuice
```

## 관련 항목

- [Exec 도구](/ko/tools/exec)
- [사고 수준](/ko/tools/thinking)
- [컨텍스트 엔진](/ko/concepts/context-engine)
