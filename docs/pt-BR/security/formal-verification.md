---
permalink: /security/formal-verification/
read_when:
    - Analisando garantias ou limites formais do modelo de segurança
    - Reproduzir ou atualizar as verificações do modelo de segurança TLA+/TLC
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenClaw.
title: Verificação formal (modelos de segurança)
x-i18n:
    generated_at: "2026-05-06T09:13:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Esta página acompanha os **modelos formais de segurança** do OpenClaw (TLA+/TLC hoje; mais conforme necessário).

> Observação: alguns links antigos podem se referir ao nome anterior do projeto.

**Objetivo (referência norteadora):** fornecer um argumento verificado por máquina de que o OpenClaw aplica sua
política de segurança pretendida (autorização, isolamento de sessão, controle de ferramentas e
segurança contra configuração incorreta), sob premissas explícitas.

**O que isto é (hoje):** uma **suíte de regressão de segurança** executável e orientada por atacante:

- Cada alegação tem uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas alegações têm um **modelo negativo** pareado que produz um rastro de contraexemplo para uma classe realista de bugs.

**O que isto ainda não é:** uma prova de que "o OpenClaw é seguro em todos os aspectos" ou de que a implementação completa em TypeScript está correta.

## Onde os modelos ficam

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Ressalvas importantes

- Estes são **modelos**, não a implementação completa em TypeScript. Pode haver divergência entre o modelo e o código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC; "verde" não implica segurança além das premissas e limites modelados.
- Algumas alegações dependem de premissas ambientais explícitas (por exemplo, implantação correta, entradas de configuração corretas).

## Reproduzindo os resultados

Hoje, os resultados são reproduzidos clonando o repositório de modelos localmente e executando o TLC (veja abaixo). Uma iteração futura poderia oferecer:

- Modelos executados em CI com artefatos públicos (rastros de contraexemplo, logs de execução)
- um fluxo hospedado "executar este modelo" para verificações pequenas e limitadas

Primeiros passos:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposição do Gateway e configuração incorreta de gateway aberto

**Alegação:** fazer binding além do loopback sem autenticação pode tornar um comprometimento remoto possível / aumenta a exposição; token/senha bloqueia atacantes não autenticados (conforme as premissas do modelo).

- Execuções verdes:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Vermelho (esperado):
  - `make gateway-exposure-v2-negative`

Veja também: `docs/gateway-exposure-matrix.md` no repositório de modelos.

### Pipeline de exec do Node (capacidade de maior risco)

**Alegação:** `exec host=node` exige (a) uma allowlist de comandos node mais comandos declarados e (b) aprovação ativa quando configurado; aprovações são tokenizadas para impedir repetição (no modelo).

- Execuções verdes:
  - `make nodes-pipeline`
  - `make approvals-token`
- Vermelho (esperado):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Armazenamento de pareamento (controle de DM)

**Alegação:** solicitações de pareamento respeitam TTL e limites de solicitações pendentes.

- Execuções verdes:
  - `make pairing`
  - `make pairing-cap`
- Vermelho (esperado):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controle de ingresso (menções + bypass de comando de controle)

**Alegação:** em contextos de grupo que exigem menção, um "comando de controle" não autorizado não consegue contornar o controle de menção.

- Verde:
  - `make ingress-gating`
- Vermelho (esperado):
  - `make ingress-gating-negative`

### Isolamento de roteamento/chave de sessão

**Alegação:** DMs de pares distintos não colapsam na mesma sessão, a menos que estejam explicitamente vinculadas/configuradas.

- Verde:
  - `make routing-isolation`
- Vermelho (esperado):
  - `make routing-isolation-negative`

## v1++: modelos limitados adicionais (concorrência, tentativas novamente, correção de rastro)

Estes são modelos subsequentes que aumentam a fidelidade em torno de modos de falha do mundo real (atualizações não atômicas, tentativas novamente e fan-out de mensagens).

### Concorrência / idempotência do armazenamento de pareamento

**Alegação:** um armazenamento de pareamento deve impor `MaxPending` e idempotência mesmo sob interleavings (ou seja, "verificar-então-gravar" deve ser atômico / bloqueado; refresh não deve criar duplicatas).

O que isso significa:

- Sob solicitações concorrentes, você não pode exceder `MaxPending` para um canal.
- Solicitações/refreshes repetidos para o mesmo `(channel, sender)` não devem criar linhas pendentes ativas duplicadas.

- Execuções verdes:
  - `make pairing-race` (verificação de limite atômica/bloqueada)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Vermelho (esperado):
  - `make pairing-race-negative` (corrida de limite begin/commit não atômica)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlação / idempotência de rastros de ingresso

**Alegação:** a ingestão deve preservar a correlação de rastro ao longo do fan-out e ser idempotente sob novas tentativas do provedor.

O que isso significa:

- Quando um evento externo se torna várias mensagens internas, cada parte mantém a mesma identidade de rastro/evento.
- Novas tentativas não resultam em processamento duplicado.
- Se os IDs de evento do provedor estiverem ausentes, a deduplicação recorre a uma chave segura (por exemplo, ID de rastro) para evitar descartar eventos distintos.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Vermelho (esperado):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedência de dmScope no roteamento + identityLinks

**Alegação:** o roteamento deve manter sessões de DM isoladas por padrão, e só colapsar sessões quando configurado explicitamente (precedência de canal + links de identidade).

O que isso significa:

- Overrides de dmScope específicos do canal devem prevalecer sobre os padrões globais.
- identityLinks devem colapsar apenas dentro de grupos vinculados explícitos, não entre pares não relacionados.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Vermelho (esperado):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Relacionado

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Contribuindo para o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
