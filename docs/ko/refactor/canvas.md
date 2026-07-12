---
read_when:
    - Canvas 호스트, 도구, 명령어, 문서 또는 프로토콜 소유권 이전
    - Canvas가 여전히 코어 소유인지 감사하기
    - 실험적 Canvas Plugin PR 준비 또는 검토
summary: Canvas를 코어에서 번들 실험용 Plugin으로 이전하기 위한 계획 및 감사 체크리스트.
title: Canvas Plugin 리팩터링
x-i18n:
    generated_at: "2026-07-12T01:13:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas Plugin 리팩터링

Canvas는 사용 빈도가 낮고 실험적입니다. 핵심 기능이 아닌 번들 Plugin으로 취급합니다. 코어는 일반적인 Gateway, Node, HTTP, 인증, 구성 및 네이티브 클라이언트 연결부를 유지할 수 있지만, Canvas 전용 동작은 `extensions/canvas` 아래에 있어야 합니다.

## 목표

현재의 페어링된 Node 동작을 유지하면서 Canvas 소유권을 `extensions/canvas`로 이동합니다.

- 에이전트용 `canvas` 도구는 Canvas Plugin에서 등록
- Canvas Node 명령은 Canvas Plugin이 등록한 경우에만 허용
- A2UI 호스트/소스 파일은 Canvas Plugin 아래에 배치
- Canvas 문서 구체화는 Canvas Plugin 아래에 배치
- CLI 명령 구현은 Canvas Plugin 아래에 배치하거나 Plugin 소유 런타임 배럴을 통해 위임
- 문서와 Plugin 인벤토리에서 Canvas를 실험적이며 Plugin 기반인 기능으로 설명

## 비목표

- 이 리팩터링에서는 네이티브 앱의 Canvas UI를 재설계하지 않습니다.
- 별도의 제품 결정에서 Canvas를 삭제하기로 하지 않는 한 iOS, Android 또는 macOS에서 Canvas 프로토콜/클라이언트 지원을 제거하지 않습니다.
- 다른 번들 Plugin에서도 동일한 연결부가 필요한 경우가 최소 하나 이상이 아니라면 Canvas만을 위한 광범위한 Plugin 서비스 프레임워크를 구축하지 않습니다.

## 현재 브랜치 상태

완료:

- `extensions/canvas`에 번들 Plugin 패키지를 추가했습니다.
- `extensions/canvas/openclaw.plugin.json`을 추가했습니다.
- 에이전트 `canvas` 도구를 `src/agents/tools/canvas-tool.ts`에서 `extensions/canvas/src/tool.ts`로 이동했습니다.
- `src/agents/openclaw-tools.ts`에서 `createCanvasTool`의 코어 등록을 제거했습니다.
- Canvas 호스트 구현을 `src/canvas-host`에서 `extensions/canvas/src/host`로 이동했습니다.
- 테스트, 패키징 및 외부 공개 Canvas 헬퍼를 위한 Plugin 소유 호환성 배럴로 `extensions/canvas/runtime-api.ts`를 유지했습니다.
- Canvas 문서 구체화를 `src/gateway/canvas-documents.ts`에서 `extensions/canvas/src/documents.ts`로 이동했습니다.
- Canvas CLI 구현과 A2UI JSONL 헬퍼를 `extensions/canvas/src/cli.ts`로 이동했습니다.
- Canvas 호스트 URL 및 범위 지정 기능 헬퍼를 `extensions/canvas/src`로 이동했습니다.
- Canvas Node 명령 기본값을 하드코딩된 코어 목록에서 Plugin `nodeInvokePolicies`로 이동했습니다.
- `plugins.entries.canvas.config.host`에 Plugin 소유 Canvas 호스트 구성을 추가했습니다.
- Canvas 및 A2UI HTTP 제공을 Canvas Plugin HTTP 경로 등록 뒤로 이동했습니다.
- Plugin 소유 HTTP 경로를 위한 일반 Plugin WebSocket 업그레이드 디스패치를 추가했습니다.
- Canvas 전용 Gateway 호스트 URL 및 Node 기능 인증을 일반적인 호스팅 Plugin 표면 및 Node 기능 헬퍼로 대체했습니다.
- Canvas 문서 URL이 코어에서 Canvas 문서 내부 구현을 가져오는 대신 Canvas Plugin을 통해 확인되도록 Plugin 소유 호스팅 미디어 리졸버를 추가했습니다.
- Canvas가 상위 명령 경로를 직접 작성하지 않고도 `openclaw nodes canvas`를 Plugin 소유 Node 기능으로 선언할 수 있도록 `api.registerNodeCliFeature(...)`를 추가했습니다.
- 프로덕션 `src/**`에서 `extensions/canvas/runtime-api.js` 가져오기를 제거했습니다.
- A2UI 번들 소스를 `apps/shared/OpenClawKit/Tools/CanvasA2UI`에서 `extensions/canvas/src/host/a2ui-app`으로 이동했습니다.
- A2UI 빌드/복사 구현을 `extensions/canvas/scripts` 아래로 이동하고 루트 빌드 연결을 일반 번들 Plugin 자산 훅으로 대체했습니다.
- 런타임의 레거시 최상위 `canvasHost` 구성 별칭을 제거했습니다.
- `openclaw doctor --fix`가 이전 `canvasHost` 구성을 `plugins.entries.canvas.config.host`로 다시 작성하도록 Canvas doctor 마이그레이션을 유지했습니다.
- Gateway 프로토콜 v4 이후의 이전 에이전트 Canvas 프로토콜 호환성을 제거했습니다. 이제 네이티브 클라이언트와 Gateway는 `pluginSurfaceUrls.canvas` 및 `node.pluginSurface.refresh`만 사용합니다. 더 이상 사용되지 않는 `canvasHostUrl`, `canvasCapability` 및 `node.canvas.capability.refresh` 경로는 이 실험적 리팩터링에서 의도적으로 지원하지 않습니다.
- 생성된 Plugin 인벤토리에 Canvas를 포함하도록 업데이트했습니다.
- `docs/plugins/reference/canvas.md`에 Plugin 참조 문서를 추가했습니다.

현재 코어가 계속 소유하는 것으로 알려진 Canvas 표면:

- `apps/` 아래의 네이티브 앱 Canvas 핸들러는 여전히 의도적으로 Canvas Plugin 표면을 사용
- `apps/` 아래의 네이티브 앱 Canvas 프로토콜/클라이언트 핸들러
- 이전 버전과 호환되는 런타임 조회를 위해 게시된 아티팩트 출력에서는 여전히 `dist/canvas-host/a2ui`를 사용하지만, 복사 단계는 이제 Plugin이 소유

## 목표 구조

`extensions/canvas`가 소유해야 하는 항목:

- Plugin 매니페스트 및 패키지 메타데이터
- 에이전트 도구 등록
- Node 호출 명령 정책
- Canvas 호스트 및 A2UI 런타임
- Canvas A2UI 번들 소스 및 자산 빌드/복사 스크립트
- Canvas 문서 생성 및 자산 확인
- Canvas CLI 구현
- Canvas 문서 페이지 및 Plugin 인벤토리 항목

코어는 일반 연결부만 소유해야 합니다.

- Plugin 탐색 및 등록
- 일반 에이전트 도구 레지스트리
- 일반 Node 호출 정책 레지스트리
- 일반 Gateway HTTP/인증 및 WebSocket 업그레이드 디스패치
- 일반 호스팅 Plugin 표면 URL 확인
- 일반 호스팅 미디어 리졸버 등록
- 일반 Node 기능 전송
- 일반 구성 연결부
- 일반 번들 Plugin 자산 훅 탐색

네이티브 앱은 프로토콜의 클라이언트로서 Canvas 명령 핸들러를 유지할 수 있습니다. 네이티브 앱은 Plugin 런타임 소유자가 아닙니다.

## 마이그레이션 단계

1. `plugins.entries.canvas.config.host`를 Plugin 소유 구성 표면으로 취급합니다.
2. Canvas가 실험적 번들 Plugin으로 설명되도록 문서를 업데이트합니다.
3. 집중 Canvas 테스트, Plugin 인벤토리 검사, Plugin SDK API 검사 및 런타임 경계의 영향을 받는 빌드/타입 검사를 실행합니다.

## 감사 체크리스트

리팩터링이 완료되었다고 판단하기 전에 다음을 확인합니다.

- `rg "src/canvas-host|../canvas-host"`가 현재 사용 중인 소스 가져오기를 반환하지 않습니다.
- `rg "canvas-tool|createCanvasTool" src`가 코어 소유 Canvas 도구 구현을 찾지 못합니다.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway`가 일반 Plugin 정책 테스트 외부에서 하드코딩된 허용 목록 기본값을 찾지 못합니다.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'`의 결과가 비어 있습니다.
- `rg "canvas-documents" src`의 결과가 비어 있습니다.
- `rg "registerNodesCanvasCommands|nodes-canvas" src`의 결과가 비어 있습니다. Canvas Plugin은 중첩된 Plugin CLI 메타데이터를 통해 `openclaw nodes canvas`를 등록합니다.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway`가 Gateway 런타임 소유 항목을 반환하지 않습니다.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json`가 호환성 래퍼 또는 Plugin 소유 경로만 찾습니다.
- `pnpm plugins:inventory:check`가 통과합니다.
- `pnpm plugin-sdk:api:check`가 통과하거나, 생성된 API 기준선이 의도적으로 업데이트되고 검토됩니다.
- 대상 Canvas 테스트가 통과합니다.
- Canvas 호스트/A2UI 경로에 대한 변경 레인 테스트가 통과합니다.
- PR 본문에 Canvas가 실험적이며 Plugin 기반이라고 명시합니다.

## 검증 명령

반복 작업 중에는 대상이 지정된 로컬 검사를 사용합니다.

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

런타임 배럴, 지연 가져오기, 패키징 또는 게시된 Plugin 표면이 변경되는 경우 푸시하기 전에 `pnpm build`를 실행합니다.
