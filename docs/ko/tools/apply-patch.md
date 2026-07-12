---
read_when:
    - 여러 파일에 걸쳐 구조화된 파일 수정이 필요합니다
    - 패치 기반 편집을 문서화하거나 디버그하려는 경우
summary: apply_patch 도구를 사용하여 여러 파일에 패치를 적용하세요
title: apply_patch 도구
x-i18n:
    generated_at: "2026-07-12T01:13:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

구조화된 패치 형식을 사용하여 파일 변경 사항을 적용합니다. 단일 `edit` 호출로 처리하기에는 불안정할 수 있는 여러 파일 또는 여러 헝크 편집에 적합합니다.

이 도구는 하나 이상의 파일 작업을 감싸는 단일 `input` 문자열을 받습니다.

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## 매개변수

- `input`(필수): `*** Begin Patch`와 `*** End Patch`를 포함한 전체 패치 내용입니다.

## 참고 사항

- 패치 경로는 상대 경로(작업 공간 디렉터리 기준)와 절대 경로를 지원합니다.
- `tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`(작업 공간 내부로 제한)입니다. 의도적으로 `apply_patch`가 작업 공간 디렉터리 외부에 쓰거나 외부 파일을 삭제하도록 하려는 경우에만 `false`로 설정하세요.
- 파일 이름을 변경하려면 `*** Update File:` 헝크 내에서 `*** Move to:`를 사용하세요.
- 필요한 경우 `*** End of File`은 파일 끝에만 삽입함을 나타냅니다.
- 모든 모델에 기본적으로 활성화되어 있습니다. 비활성화하려면 `tools.exec.applyPatch.enabled: false`로 설정하거나, `tools.exec.applyPatch.allowModels`를 사용하여 특정 모델로 제한하세요. 이 설정은 `gpt-5.4`와 같은 원시 ID 또는 `openai/gpt-5.4`와 같은 전체 ID를 허용합니다.
- 구성은 `tools.exec.applyPatch.*` 아래에 있습니다.

## 예시

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="차이점" href="/ko/tools/diffs" icon="code-compare">
    변경 사항을 표시하기 위한 읽기 전용 차이점 뷰어입니다.
  </Card>
  <Card title="실행 도구" href="/ko/tools/exec" icon="terminal">
    에이전트에서 셸 명령을 실행합니다.
  </Card>
  <Card title="코드 실행" href="/ko/tools/code-execution" icon="square-code">
    xAI를 사용한 샌드박스 원격 Python 분석입니다.
  </Card>
</CardGroup>
