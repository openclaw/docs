---
read_when:
    - Executando ou configurando a integração inicial pela CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Integração pela CLI: verifique a inferência e, em seguida, passe a configuração restante para o Crestodian'
title: Integração inicial (CLI)
x-i18n:
    generated_at: "2026-07-12T00:25:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

A integração pela CLI é o caminho recomendado de configuração pelo terminal no macOS, Linux e
Windows (nativo ou WSL2). Por padrão, ela detecta o acesso à IA já disponível na
máquina, verifica-o com uma conclusão real e inicia o Crestodian para
configurar o espaço de trabalho, o Gateway e os recursos opcionais. `openclaw setup` executa o mesmo fluxo ([Configuração](/pt-BR/cli/setup) aborda
a variante somente de configuração `--baseline`). Usuários do aplicativo para Windows também podem começar
pelo [Hub do Windows](/pt-BR/platforms/windows).

A integração guiada estabelece primeiro a inferência. Ela detecta o acesso à IA disponível,
exige uma conclusão real e somente então inicia o [Crestodian](/pt-BR/cli/crestodian)
para configurar o restante do OpenClaw. Não há Crestodian antes da inferência nem
caminho para ignorar a IA no fluxo guiado.

O assistente clássico continua disponível para login no provedor, configuração remota do Gateway,
pareamento de canais, controles do daemon, habilidades e importações. Execute-o explicitamente
com `openclaw onboard --classic`; a tela guiada de candidatos de inferência não
redireciona para ele. Depois que a inferência for aprovada, o Crestodian poderá usar `open channel
wizard for <channel>` para encaminhar ao assistente de terminal com entrada mascarada a configuração de canais
que exige segredos. Para alterar o provedor do modelo ou sua autenticação, saia
do Crestodian e execute `openclaw onboard`; o Crestodian não abre os fluxos guiado ou
clássico de provedores.

<Info>
Para iniciar uma conversa o mais rápido possível: conclua a configuração guiada, execute `openclaw dashboard` e converse no
navegador pela interface de controle. Documentação: [Painel](/pt-BR/web/dashboard).
</Info>

## Localidade

O assistente localiza os textos fixos da integração. Ordem de resolução: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` e, por fim, inglês. Localidades compatíveis: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nomes de produtos, comandos, chaves de configuração, URLs, IDs de provedores, IDs de modelos e
rótulos de plugins/canais permanecem em inglês, independentemente da localidade.

Para reconfigurar posteriormente as definições não relacionadas à inferência:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica o modo não interativo. Para scripts, use `--non-interactive` (consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation)).
</Note>

<Tip>
O assistente clássico inclui uma etapa de pesquisa na web na qual você pode escolher um provedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG ou Tavily. Alguns exigem uma chave de API; outros
não exigem chave. Configure isso posteriormente com `openclaw configure --section web`. Documentação:
[Ferramentas da web](/pt-BR/tools/web).
</Tip>

## Fluxo guiado padrão

O comando simples `openclaw onboard` segue este caminho:

1. Aceite o aviso de segurança.
2. Detecte modelos configurados, variáveis de ambiente de chaves de API e CLIs locais
   de IA compatíveis.
3. Teste o primeiro candidato detectado com uma conclusão real. Em caso de falha, exiba o
   motivo e prossiga para o próximo candidato utilizável.
4. Se não restarem opções detectadas, tente novamente um candidato detectado ou insira uma chave de API
   do provedor em uma entrada mascarada. A integração guiada
   não oferece o Crestodian nem uma saída que ignore a IA antes que a inferência funcione.
5. Persista somente a rota de modelo verificada e qualquer estado de credencial/plugin
   exigido por ela. As configurações do espaço de trabalho e do Gateway permanecem inalteradas.
6. Inicie o Crestodian com o modelo verificado para que ele possa configurar o espaço de trabalho,
   o Gateway, os canais, os agentes, os plugins e o restante da configuração opcional.

Executar novamente o comando em uma instalação configurada testa primeiro o modelo
padrão atual, tornando o fluxo guiado uma etapa de verificação e reparo. Uma verificação
com falha nunca substitui automaticamente o modelo configurado; a integração é interrompida e
pergunta como prosseguir. Execute `openclaw channels add` ou `openclaw configure` para
adições posteriores não relacionadas à inferência; use `openclaw onboard` para alterações de provedor ou da rota
de autenticação.

## Assistente clássico: início rápido ou avançado

Execute `openclaw onboard --classic` para abrir o assistente completo. Ele começa com uma
escolha entre **Início rápido** (padrões) e **Avançado** (controle total). Passe
`--flow quickstart` ou `--flow advanced` (alias `manual`) para selecionar o fluxo clássico
e ignorar essa solicitação.

<Tabs>
  <Tab title="Início rápido (padrões)">
    - Gateway local, associação de loopback
    - Espaço de trabalho padrão (ou espaço de trabalho existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway por **Token** (gerado automaticamente, mesmo em loopback)
    - Política de ferramentas: `tools.profile: "coding"` para novas configurações (um perfil explícito existente é preservado)
    - Isolamento de mensagens diretas: `session.dmScope: "per-channel-peer"` para novas configurações. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição pelo Tailscale **Off**
    - As mensagens diretas do Telegram e WhatsApp usam **lista de permissões** por padrão: o Telegram solicita um ID numérico de usuário do Telegram e o WhatsApp solicita um número de telefone

  </Tab>
  <Tab title="Avançado (controle total)">
    - Exibe todas as etapas: modo, espaço de trabalho, Gateway, canais, daemon, habilidades

  </Tab>
</Tabs>

O modo remoto (`--mode remote`) sempre usa o fluxo avançado; ele apenas
configura esta máquina para se conectar a um Gateway em outro local e nunca instala
nem altera nada no host remoto.

## O que a integração clássica configura

O modo local (padrão) percorre estas etapas:

1. **Modelo/autenticação** - escolha um fluxo de autenticação do provedor (chave de API, OAuth ou
   autenticação manual específica do provedor), incluindo um provedor personalizado
   (compatível com OpenAI, compatível com OpenAI Responses, compatível com Anthropic ou
   detecção automática desconhecida). Escolha um modelo padrão.
   Uma nova configuração com chave de API da OpenAI usa `openai/gpt-5.6` por padrão (o ID simples da API
   direta é resolvido como Sol); uma nova configuração do ChatGPT/Codex usa
   `openai/gpt-5.6-sol` por padrão. Executar novamente a configuração preserva um modelo explícito existente,
   incluindo `openai/gpt-5.5`. Selecione explicitamente `openai/gpt-5.5` se a
   conta não disponibilizar o GPT-5.6.
   Observação de segurança: se este agente executar ferramentas ou processar conteúdo de webhook/hook,
   prefira o modelo mais robusto da geração mais recente disponível e mantenha
   uma política de ferramentas rigorosa — categorias mais fracas ou antigas são mais suscetíveis à injeção de prompt.
   Em execuções não interativas, `--secret-input-mode ref` armazena referências baseadas em variáveis de ambiente
   em vez de valores de chave de API em texto simples; a variável de ambiente referenciada já deve
   estar definida, ou a integração falhará imediatamente. O modo interativo de referência de segredo pode
   apontar para uma variável de ambiente ou para uma referência de provedor configurada (`file` ou
   `exec`), com uma verificação preliminar rápida antes de salvar. Após configurar o modelo e a autenticação,
   o assistente oferece um teste opcional de conclusão em tempo real; uma falha pode retornar uma vez à
   configuração de modelo/autenticação ou ser ignorada sem bloquear o restante do
   assistente clássico. Ignorá-la não desbloqueia o Crestodian; a configuração por conversa
   ainda exige uma verificação de inferência aprovada.
2. **Espaço de trabalho** - diretório dos arquivos do agente (padrão: `~/.openclaw/workspace`). Cria os arquivos iniciais.
3. **Gateway** - porta, endereço de associação, modo de autenticação e exposição pelo Tailscale. No
   modo interativo com token, escolha o armazenamento do token em texto simples (padrão) ou opte
   por um SecretRef. Caminho não interativo para SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** - canais de conversa integrados e de plugins oficiais, incluindo
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** - instala um LaunchAgent (macOS), uma unidade systemd de usuário
   (Linux/WSL2) ou uma tarefa agendada nativa do Windows com uma alternativa por usuário
   na pasta Startup.
   Se a autenticação por token for obrigatória e `gateway.auth.token` for gerenciado por SecretRef,
   a instalação do daemon o validará, mas não persistirá um token resolvido nos
   metadados de ambiente do serviço supervisor; um SecretRef não resolvido bloqueia a
   instalação e apresenta orientações. Se `gateway.auth.token` e
   `gateway.auth.password` estiverem definidos enquanto `gateway.auth.mode` não estiver definido, a instalação
   será bloqueada até que você defina explicitamente o modo.
6. **Verificação de integridade** - inicia o Gateway e verifica se ele está acessível.
7. **Skills** - instala Skills recomendadas e suas dependências opcionais.

<Note>
Executar novamente a integração **não** apaga nada, a menos que você escolha explicitamente
**Reset** (ou passe `--reset`). Por padrão, `--reset` da CLI redefine a configuração, as credenciais
e as sessões; use `--reset-scope full` para também remover o espaço de trabalho. Se a
configuração for inválida ou contiver chaves legadas, a integração solicitará que você execute
`openclaw doctor` primeiro.
</Note>

`--flow import` executa um fluxo de migração detectado (por exemplo, Hermes) no
assistente clássico em vez de uma nova configuração; consulte [Migrar](/pt-BR/cli/migrate) e os guias de migração em
[Instalação](/pt-BR/install/migrating-hermes). `openclaw onboard --modern` é um
alias de compatibilidade para o [Crestodian](/pt-BR/cli/crestodian). Ele usa a mesma
verificação de inferência que `openclaw crestodian`: uma inferência verificada inicia o
assistente, enquanto uma falha interativa retorna à configuração guiada de inferência.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio
espaço de trabalho, suas sessões e seus perfis de autenticação. Executar sem `--workspace` inicia
um fluxo interativo para nome, espaço de trabalho, autenticação, canais e associações — ele
não é o assistente completo de `openclaw onboard`.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Espaço de trabalho padrão: `~/.openclaw/workspace-<agentId>` (ou dentro de
  `agents.defaults.workspace`, se estiver definido).
- Adicione `bindings` para encaminhar mensagens recebidas a este agente (a integração pode fazer isso por você).
- Opções não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para obter informações detalhadas sobre o comportamento de cada etapa e as saídas de configuração, consulte
[Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para obter exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para consultar todas as opções, consulte [`openclaw onboard`](/pt-BR/cli/onboard).

## Documentação relacionada

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração: [Visão geral da integração](/pt-BR/start/onboarding-overview)
- Integração do aplicativo para macOS: [Integração](/pt-BR/start/onboarding)
- Ritual da primeira execução do agente: [Inicialização do agente](/pt-BR/start/bootstrapping)
