---
read_when:
    - Você executa `openclaw` sem comando e quer entender o Crestodian
    - Você precisa de uma forma segura sem configuração para inspecionar ou reparar o OpenClaw
    - Você está projetando ou habilitando o modo de resgate de canal de mensagens
summary: Referência da CLI e modelo de segurança do Crestodian, o assistente de configuração segura sem configuração e de reparo
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

O Crestodian é o assistente local do OpenClaw para configuração, reparo e ajustes. Ele
foi projetado para continuar acessível quando o caminho normal do agente estiver com problemas.

Executar `openclaw` sem comando inicia o Crestodian em um terminal interativo.
Executar `openclaw crestodian` inicia explicitamente o mesmo assistente.

## O que o Crestodian mostra

Na inicialização, o Crestodian interativo abre o mesmo shell TUI usado por
`openclaw tui`, com um backend de chat do Crestodian. O log de chat começa com uma breve
saudação:

- quando iniciar o Crestodian
- o modelo ou caminho do planejador determinístico que o Crestodian está realmente usando
- validade da configuração e o agente padrão
- acessibilidade do Gateway a partir da primeira sondagem na inicialização
- a próxima ação de depuração que o Crestodian pode executar

Ele não expõe segredos nem carrega comandos CLI de Plugin apenas para iniciar. A TUI
ainda fornece o cabeçalho normal, log de chat, linha de status, rodapé, autocomplete
e controles do editor.

Use `status` para o inventário detalhado com caminho da configuração, caminhos de docs/source,
sondagens locais da CLI, presença de chave de API, agentes, modelo e detalhes do Gateway.

O Crestodian usa a mesma descoberta de referências do OpenClaw que os agentes regulares. Em um checkout Git,
ele aponta para `docs/` local e para a árvore de código-fonte local. Em uma instalação de pacote npm, ele
usa a documentação incluída no pacote e links para
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
- o registro de comandos de Plugin não está disponível
- nenhum agente foi configurado ainda

`openclaw --help` e `openclaw --version` ainda usam os caminhos rápidos normais.
`openclaw` não interativo sai com uma mensagem curta em vez de imprimir a ajuda
raiz, porque o produto sem comando é o Crestodian.

## Operações e aprovação

O Crestodian usa operações tipadas em vez de editar a configuração de forma ad hoc.

Operações somente leitura podem ser executadas imediatamente:

- mostrar visão geral
- listar agentes
- mostrar status do modelo/backend
- executar verificações de status ou integridade
- verificar a acessibilidade do Gateway
- executar doctor sem correções interativas
- validar configuração
- mostrar o caminho do log de auditoria

Operações persistentes exigem aprovação conversacional no modo interativo, a menos
que você passe `--yes` em um comando direto:

- gravar configuração
- executar `config set`
- definir valores compatíveis de SecretRef por meio de `config set-ref`
- executar o bootstrap de setup/onboarding
- alterar o modelo padrão
- iniciar, parar ou reiniciar o Gateway
- criar agentes
- executar reparos do doctor que reescrevem configuração ou estado

As gravações aplicadas são registradas em:

```text
~/.openclaw/audit/crestodian.jsonl
```

A descoberta não é auditada. Apenas operações aplicadas e gravações são registradas.

`openclaw onboard --modern` inicia o Crestodian como a prévia do onboarding moderno.
`openclaw onboard` simples ainda executa o onboarding clássico.

## Bootstrap de setup

`setup` é o bootstrap de onboarding com foco em chat. Ele grava apenas por meio de
operações de configuração tipadas e solicita aprovação antes.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando nenhum modelo está configurado, o setup seleciona o primeiro backend utilizável nesta
ordem e informa o que escolheu:

- modelo explícito existente, se já estiver configurado
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se nenhum estiver disponível, o setup ainda grava o workspace padrão e deixa o
modelo sem definição. Instale ou faça login no Codex/Claude Code, ou exponha
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, depois execute o setup novamente.

## Planejador assistido por modelo

O Crestodian sempre inicia em modo determinístico. Para comandos vagos que o
parser determinístico não entende, o Crestodian local pode fazer uma rodada limitada
do planejador pelos caminhos normais de runtime do OpenClaw. Primeiro ele usa o
modelo configurado do OpenClaw. Se nenhum modelo configurado ainda for utilizável, ele pode usar
como fallback runtimes locais já presentes na máquina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server do Codex: `openai/gpt-5.5` com `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

O planejador assistido por modelo não pode alterar a configuração diretamente. Ele deve traduzir a
solicitação para um dos comandos tipados do Crestodian; então as regras normais de
aprovação e auditoria se aplicam. O Crestodian imprime o modelo usado e o comando
interpretado antes de executar qualquer coisa. Rodadas do planejador fallback sem configuração
são temporárias, com ferramentas desativadas quando o runtime oferece suporte, e usam um
workspace/sessão temporários.

O modo de resgate por canal de mensagens não usa o planejador assistido por modelo. O
resgate remoto permanece determinístico para que um caminho normal do agente com problema ou comprometido
não possa ser usado como editor de configuração.

## Alternar para um agente

Use um seletor em linguagem natural para sair do Crestodian e abrir a TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` ainda abrem diretamente a TUI
normal do agente. Eles não iniciam o Crestodian.

Depois de alternar para a TUI normal, use `/crestodian` para voltar ao Crestodian.
Você pode incluir uma solicitação complementar:

```text
/crestodian
/crestodian restart gateway
```

Alternâncias de agente dentro da TUI deixam um indicativo de que `/crestodian` está disponível.

## Modo de resgate por mensagens

O modo de resgate por mensagens é o ponto de entrada do Crestodian por canal de mensagem. Ele é para
o caso em que seu agente normal está indisponível, mas um canal confiável, como WhatsApp,
ainda recebe comandos.

Comando de texto compatível:

- `/crestodian <request>`

Fluxo do operador:

```text
Você, em uma DM confiável de proprietário: /crestodian status
OpenClaw: Modo de resgate do Crestodian. Gateway acessível: não. Configuração válida: não.
Você: /crestodian restart gateway
OpenClaw: Plano: reiniciar o Gateway. Responda /crestodian yes para aplicar.
Você: /crestodian yes
OpenClaw: Aplicado. Entrada de auditoria gravada.
```

A criação de agente também pode ser enfileirada pelo prompt local ou pelo modo de resgate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

O modo de resgate remoto é uma superfície administrativa. Ele deve ser tratado como
reparo remoto de configuração, não como chat normal.

Contrato de segurança para resgate remoto:

- Desativado quando o sandboxing está ativo. Se um agente/sessão estiver em sandbox,
  o Crestodian deve recusar o resgate remoto e explicar que é necessário reparo pela CLI local.
- O estado efetivo padrão é `auto`: permitir resgate remoto apenas em operação YOLO confiável,
  em que o runtime já tem autoridade local sem sandbox.
- Exigir identidade explícita do proprietário. O resgate não deve aceitar regras curingas de remetente,
  política aberta de grupo, Webhooks não autenticados ou canais anônimos.
- Apenas DMs do proprietário por padrão. O resgate em grupo/canal exige opt-in explícito e
  ainda deve rotear prompts de aprovação para a DM do proprietário.
- O resgate remoto não pode abrir a TUI local nem alternar para uma sessão interativa do agente.
  Use `openclaw` local para transferência ao agente.
- Gravações persistentes ainda exigem aprovação, mesmo no modo de resgate.
- Auditar toda operação de resgate aplicada, incluindo canal, conta, remetente,
  chave de sessão, operação, hash da configuração antes e hash da configuração depois.
- Nunca ecoar segredos. A inspeção de SecretRef deve relatar disponibilidade, não
  valores.
- Se o Gateway estiver ativo, prefira operações tipadas do Gateway. Se o Gateway estiver
  indisponível, use apenas a superfície mínima de reparo local que não dependa do
  loop normal do agente.

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

- `"auto"`: padrão. Permitir somente quando o runtime efetivo for YOLO e
  o sandboxing estiver desativado.
- `false`: nunca permitir resgate por canal de mensagens.
- `true`: permitir explicitamente o resgate quando as verificações de proprietário/canal passarem. Isso
  ainda não deve ignorar a negação por sandboxing.

A postura YOLO padrão `"auto"` é:

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

Uma verificação smoke opcional da superfície de comandos em canal ao vivo verifica `/crestodian status` mais um
roundtrip de aprovação persistente pelo handler de resgate:

```bash
pnpm test:live:crestodian-rescue-channel
```

O setup inicial sem configuração por meio do Crestodian é coberto por:

```bash
pnpm test:docker:crestodian-first-run
```

Essa lane começa com um diretório de estado vazio, roteia `openclaw` puro para o Crestodian,
define o modelo padrão, cria um agente adicional, configura o Discord por meio da
habilitação de Plugin mais token SecretRef, valida a configuração e verifica o log de
auditoria. O QA Lab também tem um cenário com suporte de repositório para o mesmo fluxo Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/cli/doctor)
- [TUI](/pt-BR/cli/tui)
- [Sandbox](/pt-BR/cli/sandbox)
- [Segurança](/pt-BR/cli/security)
