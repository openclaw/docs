---
read_when:
    - Você executa openclaw sem nenhum comando e quer entender o Crestodian
    - Você precisa de uma forma segura para uso sem configuração para inspecionar ou reparar o OpenClaw
    - Você está projetando ou habilitando o modo de resgate de canal de mensagens
summary: Referência da CLI e modelo de segurança do Crestodian, o auxiliar seguro de instalação e reparo sem configuração
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian é o auxiliar local de configuração, reparo e setup do OpenClaw. Ele foi
projetado para permanecer acessível quando o caminho normal do agente está quebrado.

Executar `openclaw` sem comando inicia o Crestodian em um terminal interativo.
Executar `openclaw crestodian` inicia explicitamente o mesmo auxiliar.

## O que o Crestodian mostra

Na inicialização, o Crestodian interativo abre o mesmo shell TUI usado por
`openclaw tui`, com um backend de chat do Crestodian. O registro do chat começa com uma breve
saudação:

- quando iniciar o Crestodian
- o caminho de modelo ou planejador determinístico que o Crestodian está realmente usando
- validade da configuração e o agente padrão
- acessibilidade do Gateway a partir da primeira sondagem de inicialização
- a próxima ação de depuração que o Crestodian pode executar

Ele não despeja segredos nem carrega comandos de CLI de plugin apenas para iniciar. A TUI
ainda fornece o cabeçalho normal, registro do chat, linha de status, rodapé, autocomplete
e controles do editor.

Use `status` para o inventário detalhado com caminho da configuração, caminhos de docs/código-fonte,
sondagens da CLI local, presença de chaves de API, agentes, modelo e detalhes do Gateway.

O Crestodian usa a mesma descoberta de referências do OpenClaw que agentes regulares. Em um checkout Git,
ele aponta para `docs/` local e a árvore de código-fonte local. Em uma instalação de pacote npm, ele
usa a documentação empacotada do pacote e vincula para
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), com orientação explícita
para revisar o código-fonte sempre que a documentação não for suficiente.

## Exemplos

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Dentro da TUI do Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Inicialização segura

O caminho de inicialização do Crestodian é deliberadamente pequeno. Ele pode ser executado quando:

- `openclaw.json` está ausente
- `openclaw.json` é inválido
- o Gateway está fora do ar
- o registro de comandos de plugin está indisponível
- nenhum agente ainda foi configurado

`openclaw --help` e `openclaw --version` ainda usam os caminhos rápidos normais.
`openclaw` não interativo sai com uma mensagem curta em vez de imprimir a ajuda raiz,
porque o produto sem comando é o Crestodian.

## Operações e aprovação

O Crestodian usa operações tipadas em vez de editar a configuração de forma ad hoc.

Operações somente leitura podem ser executadas imediatamente:

- mostrar visão geral
- listar agentes
- listar plugins instalados
- pesquisar plugins no ClawHub
- mostrar status do modelo/backend
- executar verificações de status ou integridade
- verificar acessibilidade do Gateway
- executar doctor sem correções interativas
- validar configuração
- mostrar o caminho do log de auditoria

Operações persistentes exigem aprovação conversacional no modo interativo, a menos que
você passe `--yes` para um comando direto:

- escrever configuração
- executar `config set`
- definir valores SecretRef compatíveis por meio de `config set-ref`
- executar bootstrap de setup/onboarding
- alterar o modelo padrão
- iniciar, parar ou reiniciar o Gateway
- criar agentes
- instalar plugins do ClawHub ou npm
- desinstalar plugins
- executar reparos do doctor que reescrevem configuração ou estado

Gravações aplicadas são registradas em:

```text
~/.openclaw/audit/crestodian.jsonl
```

A descoberta não é auditada. Somente operações aplicadas e gravações são registradas.

`openclaw onboard --modern` inicia o Crestodian como a prévia de onboarding moderna.
`openclaw onboard` simples ainda executa o onboarding clássico.

## Bootstrap de setup

`setup` é o bootstrap de onboarding orientado por chat. Ele grava apenas por meio de operações
de configuração tipadas e pede aprovação primeiro.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando nenhum modelo está configurado, o setup seleciona o primeiro backend utilizável nesta
ordem e informa o que escolheu:

- modelo explícito existente, se já configurado
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se nenhum estiver disponível, o setup ainda grava o workspace padrão e deixa o
modelo não definido. Instale ou faça login no Codex/Claude Code, ou exponha
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, então execute o setup novamente.

## Planejador assistido por modelo

O Crestodian sempre inicia em modo determinístico. Para comandos imprecisos que o
parser determinístico não entende, o Crestodian local pode fazer uma rodada limitada
do planejador pelos caminhos normais de runtime do OpenClaw. Primeiro, ele usa o
modelo OpenClaw configurado. Se nenhum modelo configurado ainda for utilizável, ele pode recorrer
a runtimes locais já presentes na máquina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Harness app-server do Codex: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

O planejador assistido por modelo não pode alterar a configuração diretamente. Ele deve traduzir a
solicitação para um dos comandos tipados do Crestodian; então as regras normais de aprovação e
auditoria se aplicam. O Crestodian imprime o modelo usado e o comando interpretado
antes de executar qualquer coisa. Rodadas do planejador de fallback sem configuração são
temporárias, com ferramentas desabilitadas onde o runtime oferece suporte, e usam um
workspace/sessão temporário.

O modo de resgate por canal de mensagens não usa o planejador assistido por modelo. O resgate
remoto permanece determinístico para que um caminho normal de agente quebrado ou comprometido não
possa ser usado como editor de configuração.

## Alternando para um agente

Use um seletor em linguagem natural para sair do Crestodian e abrir a TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` ainda abrem diretamente a TUI normal
do agente. Eles não iniciam o Crestodian.

Depois de alternar para a TUI normal, use `/crestodian` para retornar ao Crestodian.
Você pode incluir uma solicitação de acompanhamento:

```text
/crestodian
/crestodian restart gateway
```

Alternâncias de agente dentro da TUI deixam uma indicação de que `/crestodian` está disponível.

## Modo de resgate por mensagem

O modo de resgate por mensagem é o ponto de entrada por canal de mensagens para o Crestodian. Ele serve para
o caso em que seu agente normal está morto, mas um canal confiável como WhatsApp
ainda recebe comandos.

Comando de texto compatível:

- `/crestodian <request>`

Fluxo do operador:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

A criação de agentes também pode ser enfileirada a partir do prompt local ou do modo de resgate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

O modo de resgate remoto é uma superfície administrativa. Ele deve ser tratado como reparo remoto de configuração,
não como chat normal.

Contrato de segurança para resgate remoto:

- Desabilitado quando o sandboxing está ativo. Se um agente/sessão estiver em sandbox,
  o Crestodian deve recusar o resgate remoto e explicar que o reparo pela CLI local é
  obrigatório.
- O estado efetivo padrão é `auto`: permitir resgate remoto somente em operação YOLO confiável,
  em que o runtime já tem autoridade local sem sandbox.
- Exigir uma identidade explícita de proprietário. O resgate não deve aceitar regras de remetente
  curinga, política de grupo aberto, webhooks não autenticados ou canais anônimos.
- DMs de proprietário somente por padrão. Resgate em grupo/canal exige opt-in explícito.
- Pesquisa e listagem de plugins são somente leitura. A instalação de plugins é local por padrão
  porque baixa código executável. A desinstalação de plugins pode ser permitida como uma
  operação de reparo aprovada quando a política de resgate permite gravações persistentes.
- O resgate remoto não pode abrir a TUI local nem alternar para uma sessão interativa de agente.
  Use `openclaw` local para transferência para agente.
- Gravações persistentes ainda exigem aprovação, mesmo no modo de resgate.
- Audite toda operação de resgate aplicada. O resgate por canal de mensagens registra canal,
  conta, remetente e metadados de endereço de origem. Operações que alteram configuração também
  registram hashes de configuração antes e depois.
- Nunca ecoe segredos. A inspeção de SecretRef deve relatar disponibilidade, não valores.
- Se o Gateway estiver ativo, prefira operações tipadas do Gateway. Se o Gateway estiver
  morto, use apenas a superfície mínima de reparo local que não depende do loop normal do
  agente.

Formato da configuração:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` deve aceitar:

- `"auto"`: padrão. Permitir somente quando o runtime efetivo é YOLO e
  sandboxing está desativado.
- `false`: nunca permitir resgate por canal de mensagens.
- `true`: permitir explicitamente o resgate quando as verificações de proprietário/canal forem aprovadas. Isso
  ainda não deve contornar a negação por sandboxing.

A postura YOLO `"auto"` padrão é:

- o modo sandbox resolve para `off`
- `tools.exec.security` resolve para `full`
- `tools.exec.ask` resolve para `off`

O resgate remoto é coberto pela lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

O fallback do planejador local sem configuração é coberto por:

```bash
pnpm test:docker:crestodian-planner
```

Um smoke opt-in de superfície de comando de canal ao vivo verifica `/crestodian status` mais uma
rodada persistente de aprovação pelo handler de resgate:

```bash
pnpm test:live:crestodian-rescue-channel
```

O setup fresco sem configuração pelo Crestodian é coberto por:

```bash
pnpm test:docker:crestodian-first-run
```

Essa lane começa com um diretório de estado vazio, roteia `openclaw` puro para o Crestodian,
define o modelo padrão, cria um agente adicional, configura Discord por meio de
uma habilitação de plugin mais SecretRef de token, valida a configuração e verifica o log de auditoria.
O QA Lab também tem um cenário baseado no repositório para o mesmo fluxo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/cli/doctor)
- [TUI](/pt-BR/cli/tui)
- [Sandbox](/pt-BR/cli/sandbox)
- [Segurança](/pt-BR/cli/security)
