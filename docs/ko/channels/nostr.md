---
read_when:
    - OpenClaw가 Nostr를 통해 다이렉트 메시지를 수신하도록 하려는 경우
    - 탈중앙화 메시징을 설정하는 중입니다
summary: NIP-04 암호화된 메시지를 통한 Nostr 직접 메시지 채널
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**상태:** 선택적 번들 Plugin(구성 전까지 기본적으로 비활성화됨).

Nostr는 소셜 네트워킹을 위한 탈중앙화 프로토콜입니다. 이 채널을 통해 OpenClaw는 NIP-04로 암호화된 다이렉트 메시지(DM)를 수신하고 응답할 수 있습니다.

## 번들 Plugin

현재 OpenClaw 릴리스는 Nostr를 번들 Plugin으로 제공하므로, 일반 패키지
빌드에는 별도 설치가 필요하지 않습니다.

### 이전/사용자 지정 설치

- 온보딩(`openclaw onboard`)과 `openclaw channels add`는 여전히 공유 채널 카탈로그에서
  Nostr를 표시합니다.
- 빌드에서 번들 Nostr를 제외한 경우, npm 패키지를 직접 설치하세요.

```bash
openclaw plugins install @openclaw/nostr
```

현재 공식 릴리스 태그를 따르려면 기본 패키지를 사용하세요. 재현 가능한 설치가
필요할 때만 정확한 버전을 고정하세요.

로컬 체크아웃을 사용하세요(개발 워크플로):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin을 설치하거나 활성화한 뒤 Gateway를 다시 시작하세요.

### 비대화형 설정

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

키를 config에 저장하는 대신 환경에 `NOSTR_PRIVATE_KEY`를 유지하려면 `--use-env`를 사용하세요.

## 빠른 설정

1. Nostr 키 쌍을 생성합니다(필요한 경우):

```bash
# Using nak
nak key generate
```

2. config에 추가합니다:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 키를 내보냅니다:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway를 다시 시작합니다.

## 구성 참조

| 키           | 유형     | 기본값                                      | 설명                              |
| ------------ | -------- | ------------------------------------------- | --------------------------------- |
| `privateKey` | string   | 필수                                        | `nsec` 또는 hex 형식의 비공개 키  |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 릴레이 URL(WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                   | DM 접근 정책                      |
| `allowFrom`  | string[] | `[]`                                        | 허용된 발신자 pubkey              |
| `enabled`    | boolean  | `true`                                      | 채널 활성화/비활성화             |
| `name`       | string   | -                                           | 표시 이름                         |
| `profile`    | object   | -                                           | NIP-01 프로필 메타데이터          |

## 프로필 메타데이터

프로필 데이터는 NIP-01 `kind:0` 이벤트로 게시됩니다. Control UI(채널 -> Nostr -> 프로필)에서 관리하거나 config에 직접 설정할 수 있습니다.

예:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

참고:

- 프로필 URL은 `https://`를 사용해야 합니다.
- 릴레이에서 가져오면 필드가 병합되고 로컬 재정의가 보존됩니다.

## 접근 제어

### DM 정책

- **pairing**(기본값): 알 수 없는 발신자는 페어링 코드를 받습니다.
- **allowlist**: `allowFrom`에 있는 pubkey만 DM을 보낼 수 있습니다.
- **open**: 공개 인바운드 DM(`allowFrom: ["*"]` 필요).
- **disabled**: 인바운드 DM을 무시합니다.

적용 참고:

- 인바운드 이벤트 서명은 발신자 정책과 NIP-04 복호화 전에 검증되므로 위조된 이벤트가 초기에 거부됩니다.
- 페어링 응답은 원본 DM 본문을 처리하지 않고 전송됩니다.
- 인바운드 DM에는 속도 제한이 적용되며, 크기가 너무 큰 페이로드는 복호화 전에 삭제됩니다.

### 허용 목록 예

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 키 형식

허용되는 형식:

- **비공개 키:** `nsec...` 또는 64자 hex
- **Pubkey(`allowFrom`):** `npub...` 또는 hex

## 릴레이

기본값: `relay.damus.io` 및 `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

팁:

- 중복성을 위해 릴레이 2~3개를 사용하세요.
- 너무 많은 릴레이는 피하세요(지연 시간, 중복).
- 유료 릴레이는 안정성을 개선할 수 있습니다.
- 로컬 릴레이는 테스트에 적합합니다(`ws://localhost:7777`).

## 프로토콜 지원

| NIP    | 상태   | 설명                                 |
| ------ | ------ | ------------------------------------ |
| NIP-01 | 지원됨 | 기본 이벤트 형식 + 프로필 메타데이터 |
| NIP-04 | 지원됨 | 암호화된 DM(`kind:4`)                |
| NIP-17 | 예정   | 선물 포장 DM                         |
| NIP-44 | 예정   | 버전 지정 암호화                     |

## 테스트

### 로컬 릴레이

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 수동 테스트

1. 로그에서 봇 pubkey(npub)를 기록합니다.
2. Nostr 클라이언트(Damus, Amethyst 등)를 엽니다.
3. 봇 pubkey로 DM을 보냅니다.
4. 응답을 확인합니다.

## 문제 해결

### 메시지를 받지 못함

- 비공개 키가 유효한지 확인하세요.
- 릴레이 URL에 연결할 수 있고 `wss://`를 사용하는지 확인하세요(로컬은 `ws://`).
- `enabled`가 `false`가 아닌지 확인하세요.
- 릴레이 연결 오류는 Gateway 로그를 확인하세요.

### 응답을 보내지 못함

- 릴레이가 쓰기를 허용하는지 확인하세요.
- 아웃바운드 연결을 확인하세요.
- 릴레이 속도 제한을 주시하세요.

### 중복 응답

- 여러 릴레이를 사용할 때 예상되는 동작입니다.
- 메시지는 이벤트 ID로 중복 제거됩니다. 첫 번째 전달만 응답을 트리거합니다.

## 보안

- 비공개 키를 절대 커밋하지 마세요.
- 키에는 환경 변수를 사용하세요.
- 프로덕션 봇에는 `allowlist`를 고려하세요.
- 서명은 발신자 정책 전에 검증되고, 발신자 정책은 복호화 전에 적용되므로 위조된 이벤트는 초기에 거부되며 알 수 없는 발신자가 전체 암호화 작업을 강제로 수행하게 할 수 없습니다.

## 제한 사항(MVP)

- 다이렉트 메시지만 지원합니다(그룹 채팅 없음).
- 미디어 첨부 파일 없음.
- NIP-04만 지원합니다(NIP-17 선물 포장 예정).

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
