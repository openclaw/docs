---
read_when:
    - Tailscale + CoreDNS를 통한 광역 검색(DNS-SD)이 필요합니다
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns`용 CLI 참조(광역 탐색 도우미)'
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

광역 검색(Tailscale + CoreDNS)을 위한 DNS 도우미입니다. 현재 macOS + Homebrew CoreDNS에 초점을 맞춥니다.

관련:

- Gateway 검색: [검색](/ko/gateway/discovery)
- 광역 검색 구성: [구성](/ko/gateway/configuration)

## 설정

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

유니캐스트 DNS-SD 검색을 위한 CoreDNS 설정을 계획하거나 적용합니다.

옵션:

- `--domain <domain>`: 광역 검색 도메인(예: `openclaw.internal`)
- `--apply`: CoreDNS 구성을 설치하거나 업데이트하고 서비스를 다시 시작합니다(sudo 필요, macOS 전용).

표시 내용:

- 확인된 검색 도메인
- 존 파일 경로
- 현재 tailnet IP
- 권장 `openclaw.json` 검색 구성
- 설정할 Tailscale Split DNS 네임서버/도메인 값

참고:

- `--apply`가 없으면 이 명령은 계획 도우미로만 동작하며 권장 설정을 출력합니다.
- `--domain`이 생략되면 OpenClaw는 구성의 `discovery.wideArea.domain`을 사용합니다.
- `--apply`는 현재 macOS만 지원하며 Homebrew CoreDNS가 필요합니다.
- `--apply`는 필요한 경우 존 파일을 부트스트랩하고, CoreDNS import 구문이 있는지 확인하며, `coredns` brew 서비스를 다시 시작합니다.

## 관련

- [CLI 참조](/ko/cli)
- [검색](/ko/gateway/discovery)
