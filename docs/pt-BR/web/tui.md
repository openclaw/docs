---
read_when:
    - Você quer um passo a passo da TUI para iniciantes
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'Interface de terminal (TUI): conecte-se ao Gateway ou execute localmente no modo incorporado'
title: TUI
x-i18n:
    generated_at: "2026-05-02T05:59:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
    source_path: web/tui.md
    workflow: 16
---

## Início rápido

### Modo Gateway

1. Inicie o Gateway.

```bash
openclaw gateway
```

2. Abra a TUI.

```bash
openclaw tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se o seu Gateway usa autenticação por senha.

### Modo local

Execute a TUI sem um Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Observações:

- `openclaw chat` e `openclaw terminal` são aliases para `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- O modo local usa diretamente o runtime do agente incorporado. A maioria das ferramentas locais funciona, mas recursos exclusivos do Gateway ficam indisponíveis.
- `openclaw` e `openclaw crestodian` também usam este shell da TUI, com Crestodian como backend local de chat de configuração e reparo.

## O que você vê

- Cabeçalho: URL de conexão, agente atual, sessão atual.
- Log do chat: mensagens do usuário, respostas do assistente, avisos do sistema, cards de ferramentas.
- Linha de status: estado da conexão/execução (connecting, running, streaming, idle, error).
- Rodapé: estado da conexão + agente + sessão + modelo + think/fast/verbose/trace/reasoning + contagens de tokens + deliver.
- Entrada: editor de texto com autocomplete.

## Modelo mental: agentes + sessões

- Agentes são slugs únicos (por exemplo, `main`, `research`). O Gateway expõe a lista.
- Sessões pertencem ao agente atual.
- Chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI expande para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, você muda explicitamente para essa sessão de agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem muitas sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente + sessão atuais ficam sempre visíveis no rodapé.
- Quando iniciada sem `--session`, a TUI em modo Gateway retoma a última sessão selecionada para o mesmo gateway, agente e escopo de sessão, se essa sessão ainda existir. Passar `--session`, `/session`, `/new` ou `/reset` continua sendo explícito.

## Envio + entrega

- As mensagens são enviadas para o Gateway; a entrega para provedores fica desativada por padrão.
- Ative a entrega:
  - `/deliver on`
  - ou o painel de Configurações
  - ou inicie com `openclaw tui --deliver`

## Seletores + sobreposições

- Seletor de modelo: lista os modelos disponíveis e define a substituição da sessão.
- Seletor de agente: escolha um agente diferente.
- Seletor de sessão: mostra apenas sessões do agente atual.
- Configurações: alterne entrega, expansão da saída de ferramentas e visibilidade do pensamento.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: abortar execução ativa
- Ctrl+C: limpar entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar expansão da saída de ferramentas
- Ctrl+T: alternar visibilidade do pensamento (recarrega o histórico)

## Comandos slash

Núcleo:

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles de sessão:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida da sessão:

- `/new` ou `/reset` (redefinir a sessão)
- `/abort` (abortar a execução ativa)
- `/settings`
- `/exit`

Somente modo local:

- `/auth [provider]` abre o fluxo de autenticação/login do provedor dentro da TUI.

Outros comandos slash do Gateway (por exemplo, `/context`) são encaminhados para o Gateway e exibidos como saída do sistema. Consulte [Comandos slash](/pt-BR/tools/slash-commands).

## Comandos de shell locais

- Prefixe uma linha com `!` para executar um comando de shell local no host da TUI.
- A TUI pergunta uma vez por sessão se deve permitir execução local; recusar mantém `!` desativado para a sessão.
- Os comandos são executados em um shell novo e não interativo no diretório de trabalho da TUI (sem `cd`/env persistente).
- Comandos de shell locais recebem `OPENCLAW_SHELL=tui-local` no ambiente.
- Um `!` sozinho é enviado como mensagem normal; espaços iniciais não acionam execução local.

## Reparar configurações pela TUI local

Use o modo local quando a configuração atual já valida e você quer que o
agente incorporado a inspecione na mesma máquina, compare-a com a documentação
e ajude a reparar desvios sem depender de um Gateway em execução.

Se `openclaw config validate` já estiver falhando, comece primeiro com `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` não contorna a proteção de configuração
inválida.

Loop típico:

1. Inicie o modo local:

```bash
openclaw chat
```

2. Peça ao agente o que você quer verificar, por exemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Use comandos de shell locais para evidência e validação exatas:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique mudanças estreitas com `openclaw config set` ou `openclaw configure`, depois execute novamente `!openclaw config validate`.
5. Se o Doctor recomendar uma migração ou reparo automático, revise e execute `!openclaw doctor --fix`.

Dicas:

- Prefira `openclaw config set` ou `openclaw configure` em vez de editar `openclaw.json` manualmente.
- `openclaw docs "<query>"` pesquisa o índice de documentação ao vivo pela mesma máquina.
- `openclaw config validate --json` é útil quando você quer erros estruturados de schema e SecretRef/resolubilidade.

## Saída de ferramentas

- Chamadas de ferramentas aparecem como cards com argumentos + resultados.
- Ctrl+O alterna entre visualizações recolhidas/expandidas.
- Enquanto as ferramentas são executadas, atualizações parciais são transmitidas para o mesmo card.

## Cores do terminal

- A TUI mantém o texto do corpo do assistente na cor de primeiro plano padrão do seu terminal, para que terminais claros e escuros continuem legíveis.
- Se o seu terminal usa fundo claro e a detecção automática estiver errada, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + streaming

- Ao conectar, a TUI carrega o histórico mais recente (padrão de 200 mensagens).
- Respostas em streaming são atualizadas no lugar até serem finalizadas.
- A TUI também escuta eventos de ferramentas do agente para cards de ferramentas mais ricos.

## Detalhes da conexão

- A TUI se registra no Gateway como `mode: "tui"`.
- Reconexões mostram uma mensagem do sistema; lacunas de eventos são exibidas no log.

## Opções

- `--local`: Executar contra o runtime local do agente incorporado
- `--url <url>`: URL WebSocket do Gateway (usa por padrão a configuração ou `ws://127.0.0.1:<port>`)
- `--token <token>`: Token do Gateway (se necessário)
- `--password <password>`: Senha do Gateway (se necessária)
- `--session <key>`: Chave da sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: Entregar respostas do assistente ao provedor (desativado por padrão)
- `--thinking <level>`: Substituir o nível de pensamento para envios
- `--message <text>`: Enviar uma mensagem inicial após conectar
- `--timeout-ms <ms>`: Timeout do agente em ms (usa por padrão `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas de histórico a carregar (padrão `200`)

<Warning>
Quando você define `--url`, a TUI não recorre à configuração nem a credenciais de ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes geram erro. No modo local, não passe `--url`, `--token` ou `--password`.
</Warning>

## Solução de problemas

Sem saída após enviar uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e ocioso/ocupado.
- Verifique os logs do Gateway: `openclaw logs --follow`.
- Confirme que o agente consegue executar: `openclaw status` e `openclaw models status`.
- Se você espera mensagens em um canal de chat, ative a entrega (`/deliver on` ou `--deliver`).

## Solução de problemas de conexão

- `disconnected`: certifique-se de que o Gateway está em execução e que seus `--url/--token/--password` estão corretos.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: você pode estar no escopo global ou ainda não ter sessões.

## Relacionado

- [Interface de controle](/pt-BR/web/control-ui) — interface de controle baseada na web
- [Configuração](/pt-BR/cli/config) — inspecione, valide e edite `openclaw.json`
- [Doctor](/pt-BR/cli/doctor) — reparo guiado e verificações de migração
- [Referência da CLI](/pt-BR/cli) — referência completa de comandos da CLI
