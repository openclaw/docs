---
read_when:
    - 기기 모델 식별자 매핑 또는 NOTICE/라이선스 파일 업데이트
    - 인스턴스 UI에서 기기 이름을 표시하는 방식 변경
summary: macOS 앱에서 친숙한 이름을 표시하기 위해 OpenClaw가 Apple 기기 모델 식별자를 벤더링하는 방법입니다.
title: 기기 모델 데이터베이스
x-i18n:
    generated_at: "2026-07-12T15:42:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOS 컴패니언 앱의 **인스턴스** UI는 Apple 모델 식별자를 알아보기 쉬운 이름에 매핑합니다(`iPad16,6` -> "iPad Pro 13인치(M4)", `Mac16,6` -> "MacBook Pro(14인치, 2024)"). 또한 `DeviceModelCatalog`는 식별자 접두사(기기 제품군으로 대체)를 사용하여 기기별 SF Symbol을 선택합니다.

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/`의 파일:

| 파일                                   | 용도                                  |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS 식별자 -> 이름 매핑        |
| `mac-device-identifiers.json`          | Mac 식별자 -> 이름 매핑               |
| `NOTICE.md`                            | 고정된 업스트림 커밋 SHA              |
| `LICENSE.apple-device-identifiers.txt` | 업스트림 MIT 라이선스                 |

## 데이터 소스

MIT 라이선스가 적용된 `kyle-seongwoo-jun/apple-device-identifiers` GitHub 저장소에서 벤더링했습니다. 빌드의 결정성을 유지하기 위해 JSON 파일은 `NOTICE.md`에 기록된 커밋 SHA로 고정되어 있습니다.

## 데이터베이스 업데이트하기

1. 고정할 업스트림 커밋 SHA를 선택합니다(iOS용 하나, macOS용 하나).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`를 새 SHA로 업데이트합니다.
3. 해당 커밋에 고정된 JSON 파일을 다시 다운로드합니다.

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `LICENSE.apple-device-identifiers.txt`가 여전히 업스트림과 일치하는지 확인하고, 업스트림 라이선스가 변경되었다면 교체합니다.
5. macOS 앱이 오류 없이 빌드되는지 확인합니다.

```bash
swift build --package-path apps/macos
```

## 관련 문서

- [Node](/ko/nodes)
- [Node 문제 해결](/ko/nodes/troubleshooting)
