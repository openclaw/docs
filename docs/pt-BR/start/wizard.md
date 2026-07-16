---
read_when:
    - Executando ou configurando a integração inicial pela CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Integração pela CLI: verifique a inferência e, em seguida, deixe o restante da configuração a cargo do OpenClaw'
title: Integração (CLI)
x-i18n:
    generated_at: "2026-07-16T12:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

A integração inicial pela CLI é o caminho recomendado para configuração pelo terminal no macOS, Linux e
Windows (nativo ou WSL2). Por padrão, ela detecta o acesso à IA já disponível na
máquina, verifica-o com uma conclusão real e inicia o OpenClaw para
configurar o espaço de trabalho, o Gateway e os recursos opcionais. `openclaw setup` executa o mesmo fluxo ([Configuração](/pt-BR/cli/setup) aborda
a variante `--baseline` somente de configuração). Usuários do Windows para desktop também podem começar
pelo [Windows Hub](/pt-BR/platforms/windows).

A integração inicial guiada estabelece primeiro a inferência. Ela detecta o acesso à IA disponível,
exige uma conclusão real e somente então inicia [OpenClaw](/cli/openclaw)
para configurar o restante do OpenClaw. Selecionar **Ignorar por enquanto** encerra a integração inicial
sem iniciar o OpenClaw.

O assistente clássico continua disponível para provedores personalizados, configuração remota do Gateway,
pareamento de canais, controles do daemon, Skills e importações. Execute-o explicitamente
com `openclaw onboard --classic`; o seletor de inferência guiado não delega
para ele. Após a inferência ser aprovada, o OpenClaw pode usar `open channel wizard for
<channel>` para transferir a configuração de canais que exige segredos para um assistente de terminal com dados mascarados.
Para alterar o provedor do modelo ou sua autenticação, saia do OpenClaw e execute
`openclaw onboard`; o OpenClaw não abre os fluxos guiado ou clássico de provedores.

<Info>
Caminho mais rápido para a primeira conversa: conclua a configuração guiada, execute `openclaw dashboard` e converse no
navegador pela interface de controle. Documentação: [Painel](/pt-BR/web/dashboard).
</Info>

## Localidade

O assistente localiza os textos fixos da integração inicial. Ordem de resolução: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` e, em seguida, inglês. Localidades compatíveis: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nomes de produtos, comandos, chaves de configuração, URLs, IDs de provedores, IDs de modelos e
rótulos de plugins/canais permanecem em inglês, independentemente da localidade.

Para reconfigurar posteriormente opções não relacionadas à inferência:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica o modo não interativo. Para scripts, use `--non-interactive` (consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation)).
</Note>

<Tip>
O assistente clássico inclui uma etapa de pesquisa na web em que é possível escolher um provedor: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG ou Tavily. Alguns exigem uma chave de API; outros
não exigem chave. Configure isso posteriormente com `openclaw configure --section web`. Documentação:
[Ferramentas da web](/pt-BR/tools/web).
</Tip>

## Padrão guiado

O comando simples `openclaw onboard` segue este caminho:

1. Aceite o aviso de segurança.
2. Detecte modelos configurados, variáveis de ambiente de chaves de API, CLIs de IA locais
   compatíveis e modelos já instalados com suporte a ferramentas em servidores Ollama ou LM
   Studio acessíveis no host do Gateway. Essa verificação somente leitura nunca baixa um
   modelo. Instalações do Gemini CLI e do Antigravity são informadas, mas não testadas automaticamente,
   pois não conseguem impor uma sondagem sem ferramentas.
3. Teste o primeiro candidato detectado com uma conclusão real. Em caso de falha, mostre o
   motivo e prossiga para o próximo candidato utilizável.
4. Se a detecção se esgotar, escolha OpenAI, Anthropic, xAI (Grok), Google ou
   OpenRouter, ou escolha **Mais…** para os provedores restantes. As regiões,
   os planos e os métodos compatíveis por navegador, dispositivo, chave de API ou token de cada provedor
   aparecem em um segundo menu e são testados com a mesma conclusão real.
   Escolha **Ignorar por enquanto** para sair sem iniciar o OpenClaw.
5. Persista somente a rota de modelo verificada e qualquer estado de credencial/plugin
   exigido por ela. As configurações do espaço de trabalho e do Gateway permanecem intactas.
6. Inicie o OpenClaw com o modelo verificado para que ele possa configurar o espaço de trabalho,
   o Gateway, os canais, os agentes, os plugins e as demais configurações opcionais.

Executar novamente o comando em uma instalação configurada testa primeiro o modelo
padrão atual, transformando o fluxo guiado em uma etapa de verificação e reparo. Uma
verificação com falha nunca substitui automaticamente o modelo configurado; a integração inicial é interrompida e
pergunta como prosseguir. Execute `openclaw channels add` ou `openclaw configure` para
adições posteriores não relacionadas à inferência; use `openclaw onboard` para alterações
de provedor ou rota de autenticação.

## Assistente clássico: Início rápido ou Avançado

Execute `openclaw onboard --classic` para abrir o assistente completo. Ele começa com uma
escolha entre **Início rápido** (padrões) e **Avançado** (controle total). Passe
`--flow quickstart` ou `--flow advanced` (alias `manual`) para selecionar o fluxo clássico
e ignorar essa solicitação.

<Tabs>
  <Tab title="Início rápido (padrões)">
    - Gateway local, vinculação ao loopback
    - Espaço de trabalho padrão (ou espaço de trabalho existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway por **Token** (gerado automaticamente, mesmo no loopback)
    - Política de ferramentas: `tools.profile: "coding"` para novas configurações (um perfil explícito existente é preservado)
    - Isolamento de mensagens diretas: `session.dmScope: "per-channel-peer"` para novas configurações. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição pelo Tailscale **Desativada**
    - As mensagens diretas do Telegram e WhatsApp usam **lista de permissões** por padrão: o Telegram solicita um ID numérico de usuário do Telegram, e o WhatsApp solicita um número de telefone

  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe todas as etapas: modo, espaço de trabalho, Gateway, canais, daemon, Skills

  </Tab>
</Tabs>

O modo remoto (`--mode remote`) sempre usa o fluxo avançado; ele apenas
configura esta máquina para se conectar a um Gateway em outro local e nunca instala
nem altera nada no host remoto.

## O que a integração inicial clássica configura

O modo local (padrão) percorre estas etapas:

1. **Modelo/Autenticação** - escolha um fluxo de autenticação do provedor (chave de API, OAuth ou
   autenticação manual específica do provedor), incluindo Provedor personalizado
   (compatível com OpenAI, compatível com OpenAI Responses, compatível com Anthropic ou
   detecção automática desconhecida). Escolha um modelo padrão.
   Uma nova configuração com chave de API da OpenAI usa `openai/gpt-5.6` por padrão (o ID simples da API direta
   é resolvido como Sol); uma nova configuração do ChatGPT/Codex usa
   `openai/gpt-5.6-sol` por padrão. Executar novamente a configuração preserva um modelo explícito existente,
   incluindo `openai/gpt-5.5`. Selecione `openai/gpt-5.5` explicitamente se a
   conta não disponibilizar o GPT-5.6.
   Observação de segurança: se esse agente executar ferramentas ou processar conteúdo de
   Webhook/gancho, prefira o modelo mais robusto da geração mais recente disponível e mantenha
   a política de ferramentas restrita — níveis menos robustos ou mais antigos são mais suscetíveis à injeção de prompts.
   Para execuções não interativas, `--secret-input-mode ref` armazena referências baseadas no ambiente
   em vez dos valores das chaves de API em texto simples; a variável de ambiente referenciada já deve
   estar definida, ou a integração inicial falhará imediatamente. O modo interativo de referência de segredo pode
   apontar para uma variável de ambiente ou uma referência de provedor configurada (`file` ou
   `exec`), com uma verificação preliminar rápida antes de salvar. Após a configuração do modelo/autenticação,
   o assistente oferece um teste opcional de conclusão em tempo real; uma falha pode retornar uma vez à
   configuração do modelo/autenticação ou ser ignorada sem bloquear o restante do
   assistente clássico. Ignorá-la não desbloqueia o OpenClaw; a configuração por conversa
   ainda exige uma verificação de inferência bem-sucedida.
2. **Espaço de trabalho** - diretório para os arquivos do agente (padrão: `~/.openclaw/workspace`). Cria os arquivos iniciais.
3. **Gateway** - porta, endereço de vinculação, modo de autenticação e exposição pelo Tailscale. No
   modo interativo de token, escolha o armazenamento do token em texto simples (padrão) ou opte
   por uma SecretRef. Caminho não interativo da SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** - canais de conversa integrados e de plugins oficiais, incluindo
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** - instala um LaunchAgent (macOS), uma unidade de usuário do systemd
   (Linux/WSL2) ou uma Tarefa Agendada nativa do Windows, com uma alternativa por usuário
   na pasta Inicializar.
   Se a autenticação por token for obrigatória e `gateway.auth.token` for gerenciada por SecretRef,
   a instalação do daemon a validará, mas não persistirá um token resolvido nos
   metadados do ambiente de serviço do supervisor; uma SecretRef não resolvida bloqueia a
   instalação e fornece orientações. Se `gateway.auth.token` e
   `gateway.auth.password` estiverem definidos enquanto `gateway.auth.mode` não estiver definido, a instalação
   será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** - inicia o Gateway e verifica se ele está acessível.
7. **Skills** - instala as Skills recomendadas e suas dependências opcionais.

<Note>
Executar novamente a integração inicial **não** apaga nada, a menos que seja escolhida explicitamente a opção
**Redefinir** (ou passado `--reset`). Na CLI, `--reset` usa por padrão a configuração, as credenciais
e as sessões; use `--reset-scope full` para remover também o espaço de trabalho. Se a
configuração for inválida ou contiver chaves legadas, a integração inicial solicitará primeiro a execução de
`openclaw doctor`.
</Note>

`--flow import` executa um fluxo de migração detectado (por exemplo, Hermes) no
assistente clássico, em vez de uma nova configuração; consulte [Migrar](/pt-BR/cli/migrate) e os guias de migração em
[Instalação](/pt-BR/install/migrating-hermes). `openclaw onboard --modern` é um
alias de compatibilidade para [OpenClaw](/cli/openclaw). Ele usa a mesma
etapa de inferência que `openclaw setup`: uma inferência verificada inicia o
assistente, enquanto uma falha interativa retorna à configuração de inferência guiada.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio
espaço de trabalho, suas sessões e seus perfis de autenticação. Executá-lo sem `--workspace` inicia
um fluxo interativo para nome, espaço de trabalho, autenticação, canais e vinculações — ele não é
o assistente `openclaw onboard` completo.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Espaço de trabalho padrão: `~/.openclaw/workspace-<agentId>` (ou em
  `agents.defaults.workspace`, se estiver definido).
- Adicione `bindings` para encaminhar mensagens recebidas a esse agente (a integração inicial pode fazer isso automaticamente).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para obter o comportamento detalhado passo a passo e as saídas de configuração, consulte
[Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para ver exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para ver a referência completa de flags, consulte [`openclaw onboard`](/pt-BR/cli/onboard).

## Documentação relacionada

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração inicial: [Visão geral da integração inicial](/pt-BR/start/onboarding-overview)
- Integração inicial do aplicativo para macOS: [Integração inicial](/pt-BR/start/onboarding)
- Ritual da primeira execução do agente: [Inicialização do agente](/pt-BR/start/bootstrapping)
