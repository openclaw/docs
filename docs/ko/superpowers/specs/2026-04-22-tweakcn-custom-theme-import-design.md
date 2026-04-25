---
x-i18n:
    generated_at: "2026-04-25T06:11:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Tweakcn 커스텀 테마 가져오기 설계

상태: 2026-04-22에 터미널에서 승인됨

## 요약

tweakcn 공유 링크에서 가져올 수 있는 브라우저 로컬 전용 커스텀 Control UI 테마 슬롯을 정확히 하나 추가합니다. 기존 내장 테마 계열은 그대로 `claw`, `knot`, `dash`입니다. 새 `custom` 계열은 일반 OpenClaw 테마 계열처럼 동작하며, 가져온 tweakcn 페이로드에 라이트 및 다크 토큰 세트가 모두 포함된 경우 `light`, `dark`, `system` 모드를 지원합니다.

가져온 테마는 현재 브라우저 프로필의 다른 Control UI 설정과 함께 로컬에만 저장됩니다. Gateway config에 기록되지 않으며 장치나 브라우저 간 동기화도 되지 않습니다.

## 문제

현재 Control UI 테마 시스템은 세 개의 하드코딩된 테마 계열로 닫혀 있습니다:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

사용자는 내장 계열과 모드 변형 간 전환은 할 수 있지만, 리포 CSS를 편집하지 않고서는 tweakcn에서 테마를 가져올 수 없습니다. 요청된 결과는 일반적인 테마 시스템보다 더 작습니다. 세 가지 내장 테마는 유지하고, tweakcn 링크에서 교체할 수 있는 사용자 제어형 가져오기 슬롯 하나를 추가합니다.

## 목표

- 기존 내장 테마 계열은 변경하지 않습니다.
- 테마 라이브러리가 아니라 가져온 슬롯을 정확히 하나만 추가합니다.
- tweakcn 공유 링크 또는 직접 `https://tweakcn.com/r/themes/{id}` URL을 받습니다.
- 가져온 테마를 브라우저 local storage에만 유지합니다.
- 가져온 슬롯이 기존 `light`, `dark`, `system` 모드 제어와 함께 동작하게 합니다.
- 실패 동작을 안전하게 유지합니다. 잘못된 가져오기로 인해 활성 UI 테마가 깨지면 안 됩니다.

## 비목표

- 다중 테마 라이브러리 또는 브라우저 로컬 가져오기 목록은 없습니다.
- Gateway 측 영속화 또는 장치 간 동기화는 없습니다.
- 임의 CSS 편집기 또는 원시 테마 JSON 편집기는 없습니다.
- tweakcn의 원격 폰트 자산을 자동으로 로드하지 않습니다.
- 한쪽 모드만 노출하는 tweakcn 페이로드를 지원하려고 하지 않습니다.
- Control UI에 필요한 경계를 넘는 리포 전반의 테마 리팩터링은 하지 않습니다.

## 이미 내려진 사용자 결정

- 세 가지 내장 테마를 유지합니다.
- tweakcn 기반 가져오기 슬롯 하나를 추가합니다.
- 가져온 테마는 Gateway config가 아니라 브라우저에 저장합니다.
- 가져온 슬롯에서 `light`, `dark`, `system`을 지원합니다.
- 다음 가져오기로 커스텀 슬롯을 덮어쓰는 것이 의도된 동작입니다.

## 권장 접근 방식

Control UI 테마 모델에 네 번째 테마 계열 id `custom`을 추가합니다. `custom` 계열은 유효한 tweakcn 가져오기가 있을 때만 선택 가능해집니다. 가져온 페이로드는 OpenClaw 전용 커스텀 테마 레코드로 정규화되어 다른 UI 설정과 함께 브라우저 local storage에 저장됩니다.

런타임에서 OpenClaw는 확인된 커스텀 CSS 변수 블록을 정의하는 관리형 `<style>` 태그를 렌더링합니다:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

이렇게 하면 커스텀 테마 변수가 `custom` 계열로 범위가 제한되고, 인라인 CSS 변수가 내장 계열로 새어 나가는 것을 피할 수 있습니다.

## 아키텍처

### 테마 모델

`ui/src/ui/theme.ts` 업데이트:

- `ThemeName`에 `custom` 추가
- `ResolvedTheme`에 `custom`과 `custom-light` 추가
- `VALID_THEME_NAMES` 확장
- `resolveTheme()`를 업데이트하여 `custom`이 기존 계열 동작을 따르도록 함:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS 선호에 따라 `custom` 또는 `custom-light`

`custom`에는 레거시 별칭을 추가하지 않습니다.

### 영속성 모델

`ui/src/ui/storage.ts`의 `UiSettings` 영속성에 선택적 커스텀 테마 페이로드 하나를 확장합니다:

- `customTheme?: ImportedCustomTheme`

권장 저장 형태:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

참고:

- `sourceUrl`은 정규화 후 원래 사용자 입력을 저장합니다.
- `themeId`는 URL에서 추출한 tweakcn 테마 id입니다.
- `label`은 가능하면 tweakcn `name` 필드이며, 없으면 `Custom`입니다.
- `light`와 `dark`는 이미 정규화된 OpenClaw 토큰 맵이며, 원시 tweakcn 페이로드가 아닙니다.
- 가져온 페이로드는 다른 브라우저 로컬 설정 옆에 저장되며 동일한 local-storage 문서로 직렬화됩니다.
- 저장된 커스텀 테마 데이터가 로드 시 없거나 유효하지 않으면, 해당 페이로드를 무시하고 영속된 계열이 `custom`이었을 경우 `theme: "claw"`로 폴백합니다.

### 런타임 적용

`ui/src/ui/app-settings.ts`와 `ui/src/ui/theme.ts` 근처의 Control UI 런타임에 좁은 범위의 커스텀 테마 스타일시트 관리자를 추가합니다.

책임:

- `document.head` 안에 안정적인 `<style id="openclaw-custom-theme">` 태그 하나를 만들거나 업데이트합니다.
- 유효한 커스텀 테마 페이로드가 있을 때만 CSS를 출력합니다.
- 페이로드가 지워지면 스타일 태그 내용을 제거합니다.
- 내장 계열 CSS는 `ui/src/styles/base.css`에 유지합니다. 가져온 토큰을 체크인된 스타일시트에 끼워 넣지 않습니다.

이 관리자는 설정이 로드, 저장, 가져오기, 제거될 때마다 실행됩니다.

### 라이트 모드 선택자

구현은 `custom-light`를 특별 취급하기보다, 계열 전반의 라이트 스타일링을 위해 `data-theme-mode="light"`를 우선 사용해야 합니다. 기존 선택자가 `data-theme="light"`에 고정되어 있고 모든 라이트 계열에 적용되어야 한다면, 이 작업의 일부로 범위를 넓힙니다.

## 가져오기 UX

`ui/src/ui/views/config.ts`의 `Appearance` 섹션 업데이트:

- `Claw`, `Knot`, `Dash` 옆에 `Custom` 테마 카드를 추가합니다.
- 가져온 커스텀 테마가 없을 때 카드를 비활성 상태로 표시합니다.
- 테마 그리드 아래에 다음을 포함한 가져오기 패널을 추가합니다:
  - tweakcn 공유 링크 또는 `/r/themes/{id}` URL용 텍스트 입력 하나
  - `Import` 버튼 하나
  - 이미 커스텀 페이로드가 있을 때의 `Replace` 경로 하나
  - 이미 커스텀 페이로드가 있을 때의 `Clear` 동작 하나
- 페이로드가 있으면 가져온 테마 라벨과 source host를 표시합니다.
- 활성 테마가 `custom`이면 대체 가져오기를 즉시 적용합니다.
- 활성 테마가 `custom`이 아니면 가져오기는 사용자가 `Custom` 카드를 선택할 때까지 새 페이로드만 저장합니다.

`ui/src/ui/views/config-quick.ts`의 빠른 설정 테마 선택기도 페이로드가 있을 때만 `Custom`을 표시해야 합니다.

## URL 파싱 및 원격 가져오기

브라우저 가져오기 경로는 다음을 받습니다:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

구현은 두 형식을 모두 다음으로 정규화해야 합니다:

- `https://tweakcn.com/r/themes/{id}`

그런 다음 브라우저는 정규화된 `/r/themes/{id}` 엔드포인트를 직접 가져옵니다.

외부 페이로드에는 좁은 범위의 스키마 검증기를 사용하세요. 이것은 신뢰되지 않는 외부 경계이므로 zod 스키마를 권장합니다.

필수 원격 필드:

- 최상위 `name` 선택적 문자열
- `cssVars.theme` 선택적 객체
- `cssVars.light` 객체
- `cssVars.dark` 객체

`cssVars.light` 또는 `cssVars.dark` 중 하나라도 없으면 가져오기를 거부합니다. 이는 의도적입니다. 승인된 제품 동작은 누락된 한쪽을 최선 노력으로 합성하는 것이 아니라 전체 모드 지원입니다.

## 토큰 매핑

tweakcn 변수를 그대로 무비판적으로 반영하지 마세요. 제한된 하위 집합만 OpenClaw 토큰으로 정규화하고 나머지는 도우미에서 파생합니다.

### 직접 가져오는 토큰

각 tweakcn 모드 블록에서:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

존재할 경우 공유 `cssVars.theme`에서:

- `font-sans`
- `font-mono`

모드 블록이 `font-sans`, `font-mono`, `radius`를 재정의하면 모드 로컬 값이 우선합니다.

### OpenClaw용 파생 토큰

가져오기 도구는 가져온 기본 색상에서 OpenClaw 전용 변수를 파생합니다:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

파생 규칙은 독립적으로 테스트할 수 있도록 순수 도우미에 둡니다. 정확한 색상 혼합 공식은 구현 세부 사항이지만, 도우미는 두 가지 제약을 만족해야 합니다:

- 가져온 테마 의도에 가까운 읽기 쉬운 대비를 보존할 것
- 동일한 가져온 페이로드에 대해 안정적인 출력을 생성할 것

### v1에서 무시하는 토큰

첫 버전에서는 다음 tweakcn 토큰을 의도적으로 무시합니다:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

이렇게 하면 범위를 현재 Control UI가 실제로 필요로 하는 토큰에 집중할 수 있습니다.

### 폰트

폰트 스택 문자열은 있으면 가져오지만, OpenClaw는 v1에서 원격 폰트 자산을 로드하지 않습니다. 가져온 스택이 브라우저에서 사용할 수 없는 폰트를 참조하면 일반적인 폴백 동작이 적용됩니다.

## 실패 동작

잘못된 가져오기는 닫힌 방식으로 실패해야 합니다.

- 잘못된 URL 형식: 인라인 검증 오류를 표시하고, 가져오지 않습니다.
- 지원되지 않는 호스트 또는 경로 형태: 인라인 검증 오류를 표시하고, 가져오지 않습니다.
- 네트워크 실패, 비정상 응답, 또는 잘못된 JSON: 인라인 오류를 표시하고, 현재 저장된 페이로드는 그대로 유지합니다.
- 스키마 실패 또는 light/dark 블록 누락: 인라인 오류를 표시하고, 현재 저장된 페이로드는 그대로 유지합니다.
- 지우기 동작:
  - 저장된 커스텀 페이로드를 제거합니다
  - 관리되는 커스텀 스타일 태그 내용을 제거합니다
  - `custom`이 활성 상태면 테마 계열을 `claw`로 되돌립니다
- 첫 로드 시 저장된 커스텀 페이로드가 유효하지 않은 경우:
  - 저장된 페이로드를 무시합니다
  - 커스텀 CSS를 출력하지 않습니다
  - 영속된 테마 계열이 `custom`이었다면 `claw`로 폴백합니다

어떤 경우에도 실패한 가져오기로 인해 활성 문서에 부분적인 커스텀 CSS 변수만 적용된 상태가 남아서는 안 됩니다.

## 구현에서 변경될 것으로 예상되는 파일

주요 파일:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

가능성이 높은 새 도우미:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

테스트:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 파싱 및 페이로드 정규화를 위한 새 집중 테스트

## 테스트

최소 구현 커버리지:

- 공유 링크 URL을 tweakcn 테마 id로 파싱
- `/themes/{id}`와 `/r/themes/{id}`를 가져오기 URL로 정규화
- 지원되지 않는 호스트와 잘못된 id 거부
- tweakcn 페이로드 형태 검증
- 유효한 tweakcn 페이로드를 정규화된 OpenClaw 라이트 및 다크 토큰 맵으로 매핑
- 브라우저 로컬 설정에 커스텀 페이로드 로드 및 저장
- `light`, `dark`, `system`에 대해 `custom` 확인
- 페이로드가 없을 때 `Custom` 선택 비활성화
- `custom`이 이미 활성일 때 가져온 테마를 즉시 적용
- 활성 커스텀 테마가 제거되면 `claw`로 폴백

수동 검증 목표:

- Settings에서 알려진 tweakcn 테마 가져오기
- `light`, `dark`, `system` 간 전환
- `custom`과 내장 계열 간 전환
- 페이지를 다시 로드하고 가져온 커스텀 테마가 로컬에 유지되는지 확인

## 롤아웃 참고

이 기능은 의도적으로 작게 설계되었습니다. 나중에 사용자가 여러 가져온 테마, 이름 변경, 내보내기, 장치 간 동기화를 요청한다면, 그것은 후속 설계로 다루세요. 이번 구현에서 테마 라이브러리 추상화를 미리 만들지는 마세요.
