---
read_when:
    - Você está instalando, configurando ou auditando o plugin de política
summary: Adiciona verificações do doctor respaldadas por política para conformidade do workspace.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-06-27T17:55:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de política

Adiciona verificações do doctor baseadas em política para conformidade do workspace.

## Distribuição

- Pacote: `@openclaw/policy`
- Rota de instalação: incluído no OpenClaw

## Superfície

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamento

O Plugin de política contribui com verificações de integridade do doctor para configurações do OpenClaw gerenciadas por política e declarações de workspace governadas. Atualmente, a política cobre conformidade de canal, metadados de ferramenta governados, postura de servidor MCP, postura de provedor de modelo, postura de acesso à rede privada, postura de exposição do Gateway, postura de workspace/ferramentas de agente, postura configurada de ferramentas globais/por agente, postura configurada do runtime de sandbox, postura de acesso de ingresso/canal, postura de tratamento de dados e postura de provedor de segredos/perfil de autenticação da configuração do OpenClaw.

A política armazena requisitos definidos em `policy.jsonc`, observa configurações e declarações de workspace existentes do OpenClaw como evidência e relata desvios por meio de `openclaw policy check` e `openclaw doctor --lint`. Uma verificação de política limpa emite hashes de política, evidência, achados e atestado que operadores podem registrar para auditoria.

`openclaw policy compare --baseline <file>` compara um arquivo de política com outro arquivo de política. É apenas conformidade em nível de configuração: usa metadados de regras de política para verificar se a política verificada não está ausente nem é mais fraca do que a baseline definida, e não inspeciona estado de runtime, credenciais ou valores secretos.

Regras de postura de ferramentas podem exigir perfis aprovados, ferramentas de sistema de arquivos limitadas ao workspace, configurações delimitadas de segurança/pergunta/host para exec, modo elevado desativado, entradas `alsoAllow` exatas e entradas obrigatórias de negação de ferramentas. Os registros de evidência registram entradas `alsoAllow` aditivas porque elas podem ampliar a postura efetiva de ferramentas. Essas verificações observam apenas conformidade de configuração; elas não leem estado de aprovação em runtime nem adicionam imposição em runtime.

Regras de postura de sandbox podem exigir modos/backends de sandbox aprovados, negar rede de contêiner do host, negar junções de namespace de contêiner, exigir montagens de contêiner somente leitura, negar montagens de socket de runtime de contêiner e perfis de contêiner irrestritos, e exigir intervalos de origem CDP do navegador em sandbox.
Essas verificações observam apenas conformidade de configuração; elas não leem estado de aprovação em runtime, inspecionam contêineres em execução nem adicionam imposição em runtime.

Regras de tratamento de dados podem exigir redação de logs sensíveis, negar captura de conteúdo de telemetria, exigir manutenção de retenção de sessão e negar indexação de memória de transcrições de sessão. Essas verificações observam apenas conformidade de configuração; elas não inspecionam logs brutos, exportações de telemetria, transcrições, arquivos de memória, segredos ou dados pessoais.

Escopos de política nomeados em `scopes.<scopeName>` podem adicionar seções de política normal mais estritas para o seletor que listam. `agentIds` oferece suporte a `tools`, `agents.workspace`, `sandbox` e `dataHandling.memory`; `channelIds` oferece suporte a `ingress.channels`.
IDs de agente em runtime que não estão explicitamente listados em `agents.list[]` são verificados em relação à postura global/padrão herdada, em vez de passarem silenciosamente sem evidência. Todo escopo presente em `policy.jsonc` deve ser válido e aplicável ao seu seletor. Regras de sobreposição são declarações adicionais, portanto não enfraquecem a política de nível superior e podem produzir seus próprios achados quando a mesma configuração observada viola ambos os escopos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentos relacionados

- [política](/pt-BR/cli/policy)
