---
read_when:
    - 원격 측정 / 개인정보 보호 제어 기능을 개발하고 있습니다
    - 수집되는 데이터에 관한 질문
summary: ClawHub CLI에서 수집하는 설치 텔레메트리와 수집을 거부하는 방법입니다.
x-i18n:
    generated_at: "2026-07-16T12:27:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 텔레메트리

ClawHub는 집계된 설치 횟수를 계산하기 위해 최소한의 CLI 텔레메트리를 사용합니다.

## 텔레메트리가 수집되는 경우

텔레메트리는 다음 조건을 모두 충족할 때만 전송됩니다.

- CLI에 로그인되어 있습니다.
- `clawhub install <slug>`을(를) 실행합니다.
- 텔레메트리가 **비활성화되지 않았습니다**(아래의 “비활성화 방법” 참조).

로그인하지 않은 경우 아무 정보도 보고되지 않습니다.

## 수집하는 정보

보고되는 각 `clawhub install`마다 CLI는 최선형 방식으로 설치 이벤트 하나를 전송합니다.

이벤트에는 다음 정보가 포함됩니다.

- `slug`: 설치된 Skills의 슬러그입니다.
- `version`: 확인할 수 있는 경우 설치된 버전입니다.

### 수집하지 _않는_ 정보

- 폴더 경로나 폴더에서 파생된 식별자는 수집하지 않습니다.
- 파일 내용은 수집하지 않습니다.
- 실행별 로그, 프롬프트 또는 기타 CLI 출력은 수집하지 않습니다.

## 설치 횟수

ClawHub는 Skills별로 다음 집계 카운터를 유지합니다.

- `installsAllTime`: 해당 Skills를 CLI로 설치한 사실을 한 번 이상 보고한 고유 사용자 수입니다.
- `installsCurrent`: 설치를 보고했으며 자신의 텔레메트리를 삭제하지 않은 고유 사용자 수입니다.

## 투명성 및 사용자 제어

모든 사람에게는 **집계된 설치 카운터**만 표시됩니다.

계정을 삭제하면 텔레메트리 데이터도 삭제됩니다.

## 텔레메트리 비활성화 방법

다음 환경 변수를 설정하십시오.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

이 변수가 설정되면 CLI는 설치 텔레메트리를 전송하지 않습니다.
