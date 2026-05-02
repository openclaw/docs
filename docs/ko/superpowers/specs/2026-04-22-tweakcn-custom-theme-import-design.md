---
x-i18n:
    generated_at: "2026-05-02T22:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Tweakcn 사용자 지정 Theme 가져오기 설계

상태: 2026-04-22에 터미널에서 승인됨

## 요약

tweakcn 공유 링크에서 가져올 수 있는 브라우저 로컬 사용자 지정 Control UI theme 슬롯을 정확히 하나 추가합니다. 기존 내장 theme 패밀리는 `claw`, `knot`, `dash`로 유지됩니다. 새로운 `custom` 패밀리는 일반 OpenClaw theme 패밀리처럼 동작하며, 가져온 tweakcn 페이로드에 라이트 및 다크 토큰 세트가 모두 포함된 경우 `light`, `dark`, `system` 모드를 지원합니다.

가져온 theme는 나머지 Control UI 설정과 함께 현재 브라우저 프로필에만 저장됩니다. gateway config에는 기록되지 않으며, 기기나 브라우저 간에 동기화되지 않습니다.

## 문제

Control UI theme 시스템은 현재 하드코딩된 세 가지 theme 패밀리로 닫혀 있습니다.

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

사용자는 내장 패밀리와 모드 변형 간에 전환할 수 있지만, repo CSS를 편집하지 않고는 tweakcn의 theme를 가져올 수 없습니다. 요청된 결과는 일반적인 theming 시스템보다 작습니다. 세 가지 내장 theme를 유지하고, tweakcn 링크에서 교체할 수 있는 사용자 제어 가져오기 슬롯 하나를 추가합니다.

## 목표

- 기존 내장 theme 패밀리를 변경하지 않습니다.
- theme 라이브러리가 아니라 가져온 사용자 지정 슬롯을 정확히 하나 추가합니다.
- tweakcn 공유 링크 또는 직접 `https://tweakcn.com/r/themes/{id}` URL을 허용합니다.
- 가져온 theme를 브라우저 local storage에만 유지합니다.
- 가져온 슬롯이 기존 `light`, `dark`, `system` 모드 컨트롤과 함께 작동하게 합니다.
- 실패 동작을 안전하게 유지합니다. 잘못된 가져오기는 활성 UI theme를 절대 망가뜨리지 않습니다.

## 비목표

- 여러 theme 라이브러리나 브라우저 로컬 가져오기 목록은 없습니다.
- Gateway 측 영속성이나 기기 간 동기화는 없습니다.
- 임의 CSS 편집기나 원시 theme JSON 편집기는 없습니다.
- tweakcn에서 원격 글꼴 자산을 자동으로 로드하지 않습니다.
- 한 모드만 노출하는 tweakcn 페이로드를 지원하려고 시도하지 않습니다.
- Control UI에 필요한 연결부를 넘어서는 repo 전체 theming 리팩터링은 없습니다.

## 이미 내려진 사용자 결정

- 세 가지 내장 theme를 유지합니다.
- tweakcn 기반 가져오기 슬롯 하나를 추가합니다.
- 가져온 theme를 gateway config가 아니라 브라우저에 저장합니다.
- 가져온 슬롯에 대해 `light`, `dark`, `system`을 지원합니다.
- 다음 가져오기로 사용자 지정 슬롯을 덮어쓰는 것이 의도된 동작입니다.

## 권장 접근 방식

네 번째 theme 패밀리 ID인 `custom`을 Control UI theme 모델에 추가합니다. `custom` 패밀리는 유효한 tweakcn 가져오기가 있을 때만 선택 가능해집니다. 가져온 페이로드는 OpenClaw 전용 사용자 지정 theme 레코드로 정규화되고, 나머지 UI 설정과 함께 브라우저 local storage에 저장됩니다.

런타임에서 OpenClaw는 해석된 사용자 지정 CSS 변수 블록을 정의하는 관리형 `<style>` 태그를 렌더링합니다.

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

이렇게 하면 사용자 지정 theme 변수가 `custom` 패밀리로 범위 지정되고, 인라인 CSS 변수가 내장 패밀리로 누출되는 것을 방지할 수 있습니다.

## 아키텍처

### Theme 모델

`ui/src/ui/theme.ts`를 업데이트합니다.

- `ThemeName`을 확장해 `custom`을 포함합니다.
- `ResolvedTheme`을 확장해 `custom`과 `custom-light`를 포함합니다.
- `VALID_THEME_NAMES`를 확장합니다.
- `resolveTheme()`를 업데이트해 `custom`이 기존 패밀리 동작을 따르도록 합니다.
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS 선호도에 따라 `custom` 또는 `custom-light`

`custom`에 대한 레거시 별칭은 추가하지 않습니다.

### 영속성 모델

`ui/src/ui/storage.ts`의 `UiSettings` 영속성을 확장해 선택적 사용자 지정 theme 페이로드 하나를 추가합니다.

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
- `themeId`는 URL에서 추출한 tweakcn theme ID입니다.
- `label`은 존재할 경우 tweakcn `name` 필드이고, 없으면 `Custom`입니다.
- `light`와 `dark`는 원시 tweakcn 페이로드가 아니라 이미 정규화된 OpenClaw 토큰 맵입니다.
- 가져온 페이로드는 다른 브라우저 로컬 설정과 나란히 존재하며, 동일한 local-storage 문서에 직렬화됩니다.
- 저장된 사용자 지정 theme 데이터가 로드 시 누락되었거나 유효하지 않으면 해당 페이로드를 무시하고, 영속된 패밀리가 `custom`이었던 경우 `theme: "claw"`로 폴백합니다.

### 런타임 적용

Control UI 런타임에 `ui/src/ui/app-settings.ts` 및 `ui/src/ui/theme.ts` 근처가 소유하는 좁은 사용자 지정 theme 스타일시트 관리자를 추가합니다.

책임:

- `document.head`에 안정적인 `<style id="openclaw-custom-theme">` 태그 하나를 만들거나 업데이트합니다.
- 유효한 사용자 지정 theme 페이로드가 있을 때만 CSS를 내보냅니다.
- 페이로드가 지워지면 style 태그 내용을 제거합니다.
- 내장 패밀리 CSS는 `ui/src/styles/base.css`에 유지합니다. 가져온 토큰을 체크인된 스타일시트에 끼워 넣지 않습니다.

이 관리자는 설정이 로드, 저장, 가져오기, 지우기될 때마다 실행됩니다.

### 라이트 모드 선택자

구현은 `custom-light`를 특수 처리하기보다, 패밀리 간 라이트 스타일링을 위해 `data-theme-mode="light"`를 선호해야 합니다. 기존 선택자가 `data-theme="light"`에 고정되어 있고 모든 라이트 패밀리에 적용되어야 한다면, 이 작업의 일부로 확장합니다.

## 가져오기 UX

`ui/src/ui/views/config.ts`의 `Appearance` 섹션을 업데이트합니다.

- `Claw`, `Knot`, `Dash` 옆에 `Custom` theme 카드를 추가합니다.
- 가져온 사용자 지정 theme가 없으면 카드를 비활성화된 상태로 표시합니다.
- theme 그리드 아래에 다음을 포함하는 가져오기 패널을 추가합니다.
  - tweakcn 공유 링크 또는 `/r/themes/{id}` URL을 위한 텍스트 입력 하나
  - `Import` 버튼 하나
  - 사용자 지정 페이로드가 이미 있을 때의 `Replace` 경로 하나
  - 사용자 지정 페이로드가 이미 있을 때의 `Clear` 동작 하나
- 페이로드가 있으면 가져온 theme 라벨과 소스 호스트를 표시합니다.
- 활성 theme가 `custom`이면 교체 가져오기가 즉시 적용됩니다.
- 활성 theme가 `custom`이 아니면, 가져오기는 사용자가 `Custom` 카드를 선택할 때까지 새 페이로드만 저장합니다.

`ui/src/ui/views/config-quick.ts`의 빠른 설정 theme 선택기 역시 페이로드가 있을 때만 `Custom`을 표시해야 합니다.

## URL 파싱 및 원격 가져오기

브라우저 가져오기 경로는 다음을 허용합니다.

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

구현은 두 형식을 모두 다음으로 정규화해야 합니다.

- `https://tweakcn.com/r/themes/{id}`

그런 다음 브라우저는 정규화된 `/r/themes/{id}` endpoint를 직접 가져옵니다.

외부 페이로드에는 좁은 schema validator를 사용합니다. 이는 신뢰할 수 없는 외부 경계이므로 zod schema가 선호됩니다.

필수 원격 필드:

- 최상위 `name`은 선택적 문자열
- `cssVars.theme`은 선택적 객체
- `cssVars.light`는 객체
- `cssVars.dark`는 객체

`cssVars.light` 또는 `cssVars.dark` 중 하나라도 누락되면 가져오기를 거부합니다. 이는 의도적입니다. 승인된 제품 동작은 누락된 한쪽을 최선으로 합성하는 것이 아니라 전체 모드 지원입니다.

## 토큰 매핑

tweakcn 변수를 맹목적으로 복제하지 않습니다. 제한된 하위 집합을 OpenClaw 토큰으로 정규화하고, 나머지는 helper에서 파생합니다.

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

### OpenClaw용으로 파생되는 토큰

가져오기는 가져온 기본 색상에서 OpenClaw 전용 변수를 파생합니다.

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

파생 규칙은 독립적으로 테스트할 수 있도록 순수 helper에 둡니다. 정확한 색상 혼합 공식은 구현 세부 사항이지만, helper는 두 가지 제약을 만족해야 합니다.

- 가져온 theme 의도에 가까운 읽기 쉬운 대비를 보존합니다.
- 동일한 가져온 페이로드에 대해 안정적인 출력을 생성합니다.

### v1에서 무시되는 토큰

이 tweakcn 토큰들은 첫 번째 버전에서 의도적으로 무시됩니다.

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

이렇게 하면 현재 Control UI가 실제로 필요로 하는 토큰에 범위를 유지할 수 있습니다.

### 글꼴

글꼴 스택 문자열은 존재하면 가져오지만, OpenClaw는 v1에서 원격 글꼴 자산을 로드하지 않습니다. 가져온 스택이 브라우저에서 사용할 수 없는 글꼴을 참조하면 일반 폴백 동작이 적용됩니다.

## 실패 동작

잘못된 가져오기는 반드시 닫힌 상태로 실패해야 합니다.

- 유효하지 않은 URL 형식: 인라인 유효성 검사 오류를 표시하고 가져오지 않습니다.
- 지원되지 않는 호스트 또는 경로 형태: 인라인 유효성 검사 오류를 표시하고 가져오지 않습니다.
- 네트워크 실패, 비정상 응답, 또는 형식이 잘못된 JSON: 인라인 오류를 표시하고 현재 저장된 페이로드는 그대로 둡니다.
- schema 실패 또는 light/dark 블록 누락: 인라인 오류를 표시하고 현재 저장된 페이로드는 그대로 둡니다.
- 지우기 동작:
  - 저장된 사용자 지정 페이로드를 제거합니다.
  - 관리형 사용자 지정 style 태그 내용을 제거합니다.
  - `custom`이 활성 상태이면 theme 패밀리를 `claw`로 다시 전환합니다.
- 첫 로드 시 유효하지 않은 저장된 사용자 지정 페이로드:
  - 저장된 페이로드를 무시합니다.
  - 사용자 지정 CSS를 내보내지 않습니다.
  - 영속된 theme 패밀리가 `custom`이었다면 `claw`로 폴백합니다.

실패한 가져오기가 활성 문서에 일부 사용자 지정 CSS 변수를 적용한 상태로 남겨서는 안 됩니다.

## 구현에서 변경될 것으로 예상되는 파일

주요 파일:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

새 helper 후보:

- `ui/src/ui/custom-theme.ts`

테스트:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 파싱 및 페이로드 정규화를 위한 새로운 집중 테스트

## 테스트

최소 구현 커버리지:

- 공유 링크 URL을 tweakcn theme ID로 파싱합니다.
- `/themes/{id}`와 `/r/themes/{id}`를 가져오기 URL로 정규화합니다.
- 지원되지 않는 호스트와 형식이 잘못된 ID를 거부합니다.
- tweakcn 페이로드 형태를 검증합니다.
- 유효한 tweakcn 페이로드를 정규화된 OpenClaw 라이트 및 다크 토큰 맵으로 매핑합니다.
- 브라우저 로컬 설정에서 사용자 지정 페이로드를 로드하고 저장합니다.
- `light`, `dark`, `system`에 대해 `custom`을 해석합니다.
- 페이로드가 없을 때 `Custom` 선택을 비활성화합니다.
- `custom`이 이미 활성 상태일 때 가져온 theme를 즉시 적용합니다.
- 활성 사용자 지정 theme가 지워지면 `claw`로 폴백합니다.

수동 검증 대상:

- Settings에서 알려진 tweakcn theme를 가져옵니다.
- `light`, `dark`, `system` 간에 전환합니다.
- `custom`과 내장 패밀리 간에 전환합니다.
- 페이지를 다시 로드하고 가져온 사용자 지정 theme가 로컬에 유지되는지 확인합니다.

## 롤아웃 참고 사항

이 기능은 의도적으로 작습니다. 나중에 사용자가 여러 가져온 theme, 이름 변경, 내보내기, 또는 기기 간 동기화를 요청하면 이를 후속 설계로 다룹니다. 이 구현에서 theme 라이브러리 추상화를 미리 만들지 마십시오.
