---
read_when:
    - Tailscale + CoreDNS를 통한 광역 검색(DNS-SD)을 사용하려는 경우
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns`용 CLI 참조(광역 검색 도우미)'
title: DNS
x-i18n:
    generated_at: "2026-07-12T00:38:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

광역 검색을 위한 DNS 도우미(Tailscale + CoreDNS). 현재는 macOS + Homebrew CoreDNS만 지원합니다.

관련 문서:

- Gateway 검색: [검색](/ko/gateway/discovery)
- 광역 검색 구성: [구성](/ko/gateway/configuration)

## `dns setup`

유니캐스트 DNS-SD 검색을 위한 CoreDNS 설정을 계획하거나 적용합니다.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| 옵션                | 효과                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `--domain <domain>` | 광역 검색 도메인(예: `openclaw.internal`).                                                   |
| `--apply`           | CoreDNS 구성을 설치/업데이트하고 서비스를 (재)시작합니다. sudo가 필요하며 macOS 전용입니다. |

`--domain`을 지정하지 않으면 OpenClaw는 구성의 `discovery.wideArea.domain`을 사용합니다.

`--apply`를 지정하지 않으면 명령은 다음 항목만 출력합니다.

- 확인된 검색 도메인 및 영역 파일 경로
- 현재 tailnet IP
- 권장 `openclaw.json` 검색 구성
- Tailscale 관리 콘솔에서 설정할 Tailscale Split DNS 네임서버/도메인 값

`--apply`를 지정하면(macOS 전용, Homebrew CoreDNS 필요):

- 영역 파일이 없으면 초기화합니다
- CoreDNS 가져오기 구문이 없으면 추가합니다
- `coredns` brew 서비스를 다시 시작합니다

## 관련 문서

- [CLI 참조](/ko/cli)
- [검색](/ko/gateway/discovery)
