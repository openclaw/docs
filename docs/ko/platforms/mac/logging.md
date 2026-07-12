---
read_when:
    - macOS 로그 캡처 또는 비공개 데이터 로깅 조사
    - 음성 깨우기/세션 수명 주기 문제 디버깅
summary: 'OpenClaw 로깅: 순환 진단 파일 로그 + 통합 로그 개인정보 보호 플래그'
title: macOS 로깅
x-i18n:
    generated_at: "2026-07-12T15:26:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 로깅(macOS)

## 순환 진단 파일 로그(디버그 창)

macOS 앱은 swift-log를 통해 로그를 기록하며(기본적으로 통합 로깅 사용), 지속적인 캡처를 위해 순환 방식의 로컬 파일 로그(`DiagnosticsFileLog`)도 작성할 수 있습니다.

- 활성화: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"**(기본적으로 꺼져 있음).
- 상세 수준: **Debug pane -> Logs -> App logging -> Verbosity** 선택기.
- 위치: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- 순환: 5 MB에서 순환하며, `.1`...`.5` 접미사가 붙은 백업을 최대 5개까지 유지합니다(가장 오래된 백업은 삭제됨).
- 지우기: **Debug pane -> Logs -> App logging -> "Clear"**를 사용하면 활성 파일과 모든 백업이 삭제됩니다.

이 파일은 민감한 정보로 취급하십시오. 검토하지 않고 공유하지 마십시오.

## macOS 통합 로깅의 비공개 데이터

서브시스템에서 `privacy -off`를 선택하지 않는 한 통합 로깅은 대부분의 페이로드를 마스킹합니다. 이는 `/Library/Preferences/Logging/Subsystems/`에 있는 plist에서 서브시스템 이름을 키로 사용하여 제어합니다. 새 로그 항목에만 이 플래그가 적용되므로 문제를 재현하기 전에 활성화하십시오. 배경 정보: [macOS 로깅 개인정보 보호 문제](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## OpenClaw(`ai.openclaw`)에 활성화

먼저 plist를 임시 파일에 작성한 다음 루트 권한으로 원자적으로 설치하십시오.

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

재부팅할 필요는 없습니다. logd가 파일을 빠르게 인식하지만, 비공개 페이로드는 새 로그 줄에만 포함됩니다. `./scripts/clawlog.sh --category WebChat --last 5m`을 사용하여 더 자세한 출력을 확인하십시오(`--last`/`-l`은 시간 범위를 설정하며 기본값은 `5m`이고, `--category`/`-c`는 카테고리별로 필터링합니다).

## 디버깅 후 비활성화

- 재정의를 제거합니다: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- 선택적으로 `sudo log config --reload`를 실행하여 logd가 재정의를 즉시 해제하도록 합니다.
- 이 로그에는 전화번호와 메시지 본문이 포함될 수 있으므로 실제로 필요한 동안에만 plist를 유지하십시오.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [Gateway 로깅](/ko/gateway/logging)
