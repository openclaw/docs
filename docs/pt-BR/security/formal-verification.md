---
permalink: /security/formal-verification/
read_when:
    - Análise das garantias ou limitações formais do modelo de segurança
    - Reprodução ou atualização das verificações do modelo de segurança TLA+/TLC
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenClaw.
title: Verificação formal (modelos de segurança)
x-i18n:
    generated_at: "2026-07-12T15:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Os modelos formais de segurança do OpenClaw (atualmente TLA+/TLC) fornecem um argumento verificado por máquina de que caminhos específicos de maior risco — autorização, isolamento de sessões, controle de acesso a ferramentas e segurança contra configurações incorretas — aplicam a política pretendida, sob premissas explicitamente declaradas.

> Observação: alguns links mais antigos podem fazer referência ao nome anterior do projeto.

## O que é isto

Um conjunto executável de testes de regressão de segurança orientados por invasores:

- Cada alegação tem uma verificação de modelo executável sobre um espaço de estados finito.
- Muitas alegações têm um modelo negativo correspondente que produz um traço de contraexemplo para uma classe realista de bugs.

Isto **não** é uma prova de que o OpenClaw seja seguro em todos os aspectos e não verifica a implementação completa em TypeScript.

## Onde ficam os modelos

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Esse repositório está inacessível no momento (o GitHub retorna "Repository not found" na data desta redação). Se ele ainda estiver indisponível para você, pergunte nos canais de mantenedores do OpenClaw qual é a localização atual antes de presumir que os modelos foram removidos.
</Note>

## Ressalvas

- Estes são modelos, não a implementação completa em TypeScript — é possível haver divergência entre o modelo e o código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC. Um resultado verde não implica segurança além das premissas e dos limites modelados.
- Algumas alegações dependem de premissas explícitas sobre o ambiente (por exemplo, implantação correta e entradas de configuração corretas).

## Como reproduzir os resultados

Clone o repositório dos modelos e execute o TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Requer Java 11+ (o TLC é executado na JVM).
# O repositório inclui uma versão fixa de tla2tools.jar e fornece bin/tlc, além de alvos do Make.

make <target>
```

Ainda não há integração de CI com este repositório; uma iteração futura poderia adicionar modelos executados pela CI com artefatos públicos (traços de contraexemplo, logs de execução) ou um fluxo de trabalho hospedado de "executar este modelo" para verificações pequenas e limitadas.

## Alegações e alvos

### Exposição do Gateway e configuração incorreta de Gateway aberto

**Alegação:** vincular a interfaces além de loopback sem autenticação pode possibilitar comprometimento remoto e aumentar a exposição; um token/uma senha bloqueia invasores não autenticados, de acordo com as premissas do modelo.

| Resultado           | Alvos                                                            |
| ------------------- | ---------------------------------------------------------------- |
| Verde               | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Vermelho (esperado) | `make gateway-exposure-v2-negative`                              |

Consulte também `docs/gateway-exposure-matrix.md` no repositório dos modelos.

### Pipeline de execução do Node (recurso de maior risco)

**Alegação:** `exec host=node` exige (a) uma lista de comandos permitidos do Node, além dos comandos declarados, e (b) aprovação em tempo real quando configurada; no modelo, as aprovações usam tokens para impedir a repetição.

| Resultado           | Alvos                                                           |
| ------------------- | --------------------------------------------------------------- |
| Verde               | `make nodes-pipeline`, `make approvals-token`                   |
| Vermelho (esperado) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Armazenamento de emparelhamento (controle de acesso a DMs)

**Alegação:** as solicitações de emparelhamento respeitam o TTL e os limites de solicitações pendentes.

| Resultado           | Alvos                                                |
| ------------------- | ---------------------------------------------------- |
| Verde               | `make pairing`, `make pairing-cap`                   |
| Vermelho (esperado) | `make pairing-negative`, `make pairing-cap-negative` |

### Controle de entrada (menções e desvio por comandos de controle)

**Alegação:** em contextos de grupo que exigem menção, um comando de controle não autorizado não consegue contornar o controle por menção.

| Resultado           | Alvos                          |
| ------------------- | ------------------------------ |
| Verde               | `make ingress-gating`          |
| Vermelho (esperado) | `make ingress-gating-negative` |

### Roteamento e isolamento de chaves de sessão

**Alegação:** DMs de pares distintos não são agrupadas na mesma sessão, a menos que sejam explicitamente vinculadas ou configuradas.

| Resultado           | Alvos                             |
| ------------------- | --------------------------------- |
| Verde               | `make routing-isolation`          |
| Vermelho (esperado) | `make routing-isolation-negative` |

## Modelos v1++: concorrência, novas tentativas e correção de traços

Modelos subsequentes que aumentam a fidelidade em relação a modos de falha do mundo real: atualizações não atômicas, novas tentativas e distribuição de mensagens.

### Concorrência e idempotência do armazenamento de emparelhamento

**Alegação:** o armazenamento de emparelhamento aplica `MaxPending` e idempotência mesmo com intercalações — verificar e depois gravar deve ser uma operação atômica/bloqueada, e a atualização não deve criar duplicatas. Especificamente: solicitações simultâneas não podem exceder `MaxPending` em um canal, e solicitações/atualizações repetidas para o mesmo `(channel, sender)` não criam linhas pendentes ativas duplicadas.

| Resultado           | Alvos                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verde               | `make pairing-race` (verificação atômica/bloqueada do limite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                              |
| Vermelho (esperado) | `make pairing-race-negative` (condição de corrida não atômica entre início/confirmação do limite), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Correlação de traços e idempotência da entrada

**Alegação:** a ingestão preserva a correlação de traços durante a distribuição e é idempotente durante novas tentativas do provedor. Quando um evento externo se transforma em várias mensagens internas, cada parte mantém a mesma identidade de traço/evento; novas tentativas não causam processamento duplicado; se os IDs de eventos do provedor estiverem ausentes, a desduplicação recorre a uma chave segura (por exemplo, o ID do traço) para evitar o descarte de eventos distintos.

| Resultado           | Alvos                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Verde               | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Vermelho (esperado) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Precedência de dmScope e identityLinks no roteamento

**Alegação:** o roteamento mantém as sessões de DM isoladas por padrão e somente agrupa sessões quando isso é configurado explicitamente, por meio da precedência de canais e de vínculos de identidade. As substituições de `dmScope` específicas de cada canal têm precedência sobre os padrões globais; `identityLinks` agrupam sessões somente dentro de grupos explicitamente vinculados, não entre pares não relacionados.

| Resultado           | Alvos                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Verde               | `make routing-precedence`, `make routing-identitylinks`                   |
| Vermelho (esperado) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Relacionados

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Como contribuir para o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
- [Resposta a incidentes](/pt-BR/security/incident-response)
