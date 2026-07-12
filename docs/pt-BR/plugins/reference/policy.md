---
read_when:
    - Você está instalando, configurando ou auditando o plugin de políticas
summary: Adiciona verificações do doctor respaldadas por políticas para garantir a conformidade do workspace.
title: Plugin de política
x-i18n:
    generated_at: "2026-07-12T00:15:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de política

Adiciona verificações do doctor respaldadas por políticas para a conformidade do espaço de trabalho.

## Distribuição

- Pacote: `@openclaw/policy`
- Método de instalação: incluído no OpenClaw

## Superfície

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamento

O Plugin de Política fornece verificações de integridade do doctor para configurações do OpenClaw gerenciadas por políticas e declarações de espaço de trabalho controladas. Atualmente, a política abrange a conformidade de canais, os metadados controlados de ferramentas, a postura dos servidores MCP, a postura dos provedores de modelos, a postura de acesso à rede privada, a postura de exposição do Gateway, a postura do espaço de trabalho e das ferramentas dos agentes, a postura configurada das ferramentas globais e por agente, a postura configurada do ambiente de execução do sandbox, a postura de acesso de entrada e dos canais, a postura de tratamento de dados e a postura dos provedores de segredos e dos perfis de autenticação da configuração do OpenClaw.

A política armazena os requisitos definidos em `policy.jsonc`, observa as configurações e declarações de espaço de trabalho existentes do OpenClaw como evidências e relata divergências por meio de `openclaw policy check` e `openclaw doctor --lint`. Uma verificação de política sem problemas gera hashes de política, evidências, constatações e atestados que os operadores podem registrar para auditoria.

`openclaw policy compare --baseline <file>` compara um arquivo de política com outro arquivo de política. Essa comparação verifica apenas a conformidade no nível da configuração: ela usa os metadados das regras de política para verificar se a política analisada não está incompleta nem é menos rigorosa que a linha de base definida, e não inspeciona o estado do ambiente de execução, credenciais nem valores de segredos.

As regras de postura das ferramentas podem exigir perfis aprovados, ferramentas de sistema de arquivos restritas ao espaço de trabalho, configurações limitadas de segurança, confirmação e host para execução, modo elevado desativado, entradas `alsoAllow` exatas e entradas obrigatórias de negação de ferramentas. As evidências registram entradas `alsoAllow` adicionais, pois elas podem ampliar a postura efetiva das ferramentas. Essas verificações observam apenas a conformidade da configuração; elas não leem o estado de aprovação do ambiente de execução nem adicionam imposição em tempo de execução.

As regras de postura do sandbox podem exigir modos e back-ends de sandbox aprovados, proibir a rede do host em contêineres, proibir a associação a namespaces de contêineres, exigir montagens de contêiner somente leitura, proibir montagens de soquetes do ambiente de execução de contêineres e perfis de contêiner sem confinamento, além de exigir intervalos de origem CDP para o navegador no sandbox.
Essas verificações observam apenas a conformidade da configuração; elas não leem o estado de aprovação do ambiente de execução, não inspecionam contêineres ativos nem adicionam imposição em tempo de execução.

As regras de tratamento de dados podem exigir a ocultação de informações confidenciais nos logs, proibir a captura de conteúdo por telemetria, exigir a manutenção da retenção de sessões e proibir a indexação na memória de transcrições de sessões. Essas verificações observam apenas a conformidade da configuração; elas não inspecionam logs brutos, exportações de telemetria, transcrições, arquivos de memória, segredos nem dados pessoais.

Os escopos de política nomeados em `scopes.<scopeName>` podem adicionar seções normais de política mais rigorosas para o seletor indicado. `agentIds` aceita `tools`, `agents.workspace`, `sandbox` e `dataHandling.memory`; `channelIds` aceita `ingress.channels`.
Os IDs de agentes do ambiente de execução que não estejam explicitamente listados em `agents.list[]` são verificados em relação à postura global ou padrão herdada, em vez de serem aprovados silenciosamente sem evidências. Todos os escopos presentes em `policy.jsonc` devem ser válidos e aplicáveis ao respectivo seletor. As regras de sobreposição são requisitos adicionais, portanto não reduzem o rigor da política de nível superior e podem gerar suas próprias constatações quando a mesma configuração observada viola ambos os escopos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentação relacionada

- [política](/pt-BR/cli/policy)
