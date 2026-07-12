---
read_when:
    - OpenClaw에서 더 짧은 `exec` 또는 `bash` 도구 결과를 원합니다
    - Tokenjuice Plugin을 설치하거나 활성화하려고 합니다
    - tokenjuice가 무엇을 변경하고 무엇을 원시 상태로 두는지 이해해야 합니다
summary: 선택적 Tokenjuice Plugin으로 불필요하게 긴 exec 및 bash 도구 결과 압축하기
title: 토큰주스
x-i18n:
    generated_at: "2026-07-12T01:16:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice`는 명령이 이미 실행된 후 내용이 복잡한 `exec` 및 `bash` 도구 결과를 압축하는 선택적 외부 Plugin입니다.

명령 자체가 아니라 반환되는 `tool_result`를 변경합니다. Tokenjuice는 셸 입력을 다시 작성하거나, 명령을 다시 실행하거나, 종료 코드를 변경하지 않습니다.

현재 이는 Codex 앱 서버 하네스의 OpenClaw 임베디드 실행 및 OpenClaw 동적 도구에 적용됩니다. Tokenjuice는 OpenClaw의 도구 결과 미들웨어에 연결되어 결과가 활성 하네스 세션으로 돌아가기 전에 출력을 정리합니다.

## Plugin 활성화

한 번 설치합니다.

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

그런 다음 활성화합니다.

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

동일한 명령:

```bash
openclaw plugins enable tokenjuice
```

구성을 직접 편집하려면 다음과 같이 설정합니다.

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

## tokenjuice가 변경하는 사항

- 내용이 복잡한 `exec` 및 `bash` 결과가 세션에 다시 전달되기 전에 압축합니다.
- 원래 명령 실행은 변경하지 않습니다.
- 안전한 인벤토리 정책을 적용합니다. 정확한 파일 내용 읽기는 원문을 유지하고, 독립적인 저장소 인벤토리 명령은 압축할 수 있으며, 안전하지 않은 혼합 명령 시퀀스는 원문을 유지합니다.
- 명시적으로 활성화해야 합니다. 모든 곳에서 출력을 원문 그대로 유지하려면 Plugin을 비활성화하세요.

## 작동 여부 확인

1. Plugin을 활성화합니다.
2. `exec`를 호출할 수 있는 세션을 시작합니다.
3. `git status`와 같이 출력이 많은 명령을 실행합니다.
4. 반환된 도구 결과가 원본 셸 출력보다 짧고 구조화되어 있는지 확인합니다.

## Plugin 비활성화

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

또는:

```bash
openclaw plugins disable tokenjuice
```

## 관련 문서

- [Exec 도구](/ko/tools/exec)
- [사고 수준](/ko/tools/thinking)
- [컨텍스트 엔진](/ko/concepts/context-engine)
