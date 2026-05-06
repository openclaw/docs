---
read_when:
    - macOS 로그 캡처 또는 비공개 데이터 로깅 조사
    - 음성 깨우기/세션 수명 주기 문제 디버깅
summary: 'OpenClaw 로깅: 순환 진단 파일 로그 + 통합 로그 개인정보 보호 플래그'
title: macOS 로깅
x-i18n:
    generated_at: "2026-05-06T06:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 로깅(macOS)

## 순환 진단 파일 로그(디버그 패널)

OpenClaw는 macOS 앱 로그를 swift-log를 통해 라우팅하며(기본적으로 통합 로깅), 지속 보관 가능한 캡처가 필요할 때 로컬 순환 파일 로그를 디스크에 쓸 수 있습니다.

- 상세도: **디버그 패널 → 로그 → 앱 로깅 → 상세도**
- 활성화: **디버그 패널 → 로그 → 앱 로깅 → "순환 진단 로그 쓰기(JSONL)"**
- 위치: `~/Library/Logs/OpenClaw/diagnostics.jsonl`(자동으로 순환됨; 이전 파일에는 `.1`, `.2`, … 접미사가 붙음)
- 지우기: **디버그 패널 → 로그 → 앱 로깅 → "지우기"**

참고:

- 이 기능은 **기본적으로 꺼져 있습니다**. 적극적으로 디버깅하는 동안에만 활성화하세요.
- 파일을 민감한 정보로 취급하세요. 검토 없이 공유하지 마세요.

## macOS의 통합 로깅 비공개 데이터

하위 시스템이 `privacy -off`를 선택하지 않는 한 통합 로깅은 대부분의 페이로드를 가립니다. Peter의 macOS [로깅 개인 정보 관련 문제](https://steipete.me/posts/2025/logging-privacy-shenanigans)(2025) 글에 따르면, 이는 `/Library/Preferences/Logging/Subsystems/`에 있는 plist에서 하위 시스템 이름을 키로 사용해 제어됩니다. 새 로그 항목에만 이 플래그가 적용되므로, 문제를 재현하기 전에 활성화하세요.

## OpenClaw(`ai.openclaw`)에 활성화

- 먼저 plist를 임시 파일에 쓴 다음, root로 원자적으로 설치합니다.

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 재부팅은 필요하지 않습니다. logd가 파일을 빠르게 감지하지만, 새 로그 줄에만 비공개 페이로드가 포함됩니다.
- 기존 헬퍼로 더 풍부한 출력을 확인하세요. 예: `./scripts/clawlog.sh --category WebChat --last 5m`.

## 디버깅 후 비활성화

- 오버라이드를 제거합니다: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- 필요하면 `sudo log config --reload`를 실행해 logd가 오버라이드를 즉시 제거하도록 강제할 수 있습니다.
- 이 표면에는 전화번호와 메시지 본문이 포함될 수 있습니다. 추가 세부 정보가 실제로 필요한 동안에만 plist를 유지하세요.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [Gateway 로깅](/ko/gateway/logging)
