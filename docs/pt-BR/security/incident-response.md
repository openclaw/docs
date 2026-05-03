---
read_when:
    - Como responder a um relatório de segurança ou a uma suspeita de incidente de segurança
    - Preparando uma divulgação coordenada ou um lançamento de segurança com correção
    - Revisando as expectativas de acompanhamento pós-incidente
summary: Como o OpenClaw faz a triagem, responde e acompanha incidentes de segurança
title: Resposta a incidentes
x-i18n:
    generated_at: "2026-05-03T21:38:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Resposta a Incidentes

## 1. Detecção e triagem

Monitoramos sinais de segurança de:

- GitHub Security Advisories (GHSA) e relatórios privados de vulnerabilidades.
- Issues/discussões públicas do GitHub quando os relatórios não são sensíveis.
- Sinais automatizados (por exemplo Dependabot, CodeQL, avisos do npm e verificação de segredos).

Triagem inicial:

1. Confirme o componente afetado, a versão e o impacto no limite de confiança.
2. Classifique como problema de segurança vs. reforço de segurança/sem ação usando o escopo e as regras fora de escopo do `SECURITY.md` do repositório.
3. Um responsável pelo incidente responde conforme apropriado.

## 2. Avaliação

Guia de severidade:

- **Crítica:** Comprometimento de pacote/lançamento/repositório, exploração ativa ou bypass não autenticado de limite de confiança com controle de alto impacto ou exposição de dados.
- **Alta:** Bypass verificado de limite de confiança que exige pré-condições limitadas (por exemplo, ação autenticada, mas não autorizada, de alto impacto), ou exposição de credenciais sensíveis pertencentes ao OpenClaw.
- **Média:** Fraqueza de segurança significativa com impacto prático, mas explorabilidade restrita ou pré-requisitos substanciais.
- **Baixa:** Achados de defesa em profundidade, negação de serviço com escopo restrito ou lacunas de reforço/paridade sem bypass demonstrado de limite de confiança.

## 3. Resposta

1. Confirme o recebimento ao relator (em privado quando sensível).
2. Reproduza em lançamentos com suporte e no `main` mais recente; em seguida, implemente e valide um patch com cobertura de regressão.
3. Para incidentes críticos/altos, prepare lançamento(s) corrigido(s) tão rápido quanto for prático.
4. Para incidentes médios/baixos, aplique o patch no fluxo normal de lançamento e documente orientações de mitigação.

## 4. Comunicação

Comunicamos por meio de:

- GitHub Security Advisories no repositório afetado.
- Notas de lançamento/entradas do registro de alterações para versões corrigidas.
- Acompanhamento direto com o relator sobre status e resolução.

Política de divulgação:

- Incidentes críticos/altos devem receber divulgação coordenada, com emissão de CVE quando apropriado.
- Achados de reforço de segurança de baixo risco podem ser documentados em notas de lançamento ou avisos sem CVE, dependendo do impacto e da exposição do usuário.

## 5. Recuperação e acompanhamento

Após enviar a correção:

1. Verifique as remediações em CI e nos artefatos de lançamento.
2. Execute uma breve revisão pós-incidente (linha do tempo, causa raiz, lacuna de detecção, plano de prevenção).
3. Adicione tarefas de acompanhamento de reforço de segurança/testes/docs e acompanhe-as até a conclusão.
