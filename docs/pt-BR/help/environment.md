---
read_when:
    - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
    - Você está depurando chaves de API ausentes no Gateway
    - Você está documentando autenticação de provedores ou ambientes de implantação
summary: Onde o OpenClaw carrega variáveis de ambiente e a ordem de precedência
title: Variáveis de ambiente
x-i18n:
    generated_at: "2026-06-27T17:35:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw obtém variáveis de ambiente de várias fontes. A regra é **nunca sobrescrever valores existentes**.
Arquivos `.env` do workspace são uma fonte de menor confiança: o OpenClaw ignora credenciais de provedores e controles protegidos de runtime vindos do `.env` do workspace antes de aplicar a precedência.

## Precedência (maior → menor)

1. **Ambiente do processo** (o que o processo do Gateway já tem do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão do dotenv; não sobrescreve; credenciais de provedores e controles protegidos de runtime são ignorados).
3. **`.env` global** em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`; recomendado para chaves de API de provedores; não sobrescreve).
4. **Bloco `env` de configuração** em `~/.openclaw/openclaw.json` (aplicado somente se estiver ausente).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada somente para chaves esperadas ausentes.

Em instalações novas do Ubuntu que usam o diretório de estado padrão, o OpenClaw também trata `~/.config/openclaw/gateway.env` como um fallback de compatibilidade depois do `.env` global. Se ambos os arquivos existirem e divergirem, o OpenClaw mantém `~/.openclaw/.env` e imprime um aviso.

Se o arquivo de configuração estiver totalmente ausente, a etapa 4 será ignorada; a importação do shell ainda será executada se estiver habilitada.

## Credenciais de provedores e `.env` do workspace

Não mantenha chaves de API de provedores apenas em um `.env` do workspace. O OpenClaw ignora variáveis de ambiente de credenciais de provedores de arquivos `.env` do workspace, incluindo chaves comuns como `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` e `FIRECRAWL_API_KEY`.

Use uma destas fontes confiáveis para credenciais de provedores:

- O ambiente do processo do Gateway, como um shell, unidade launchd/systemd, segredo de contêiner ou segredo de CI.
- O arquivo dotenv global de runtime em `~/.openclaw/.env` ou `$OPENCLAW_STATE_DIR/.env`.
- O bloco `env` de configuração em `~/.openclaw/openclaw.json`.
- Importação opcional do shell de login quando `env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1` estiver habilitado.

Se você armazenou anteriormente chaves de provedores apenas em um `.env` do workspace, mova-as para uma das fontes confiáveis acima. O `.env` do workspace ainda pode fornecer variáveis comuns do projeto que não sejam credenciais, redirecionamentos de endpoint, substituições de host ou controles de runtime `OPENCLAW_*`.

Consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security#workspace-env-files) para a justificativa de segurança.

## Bloco `env` de configuração

Duas formas equivalentes de definir variáveis de ambiente inline (ambas sem sobrescrever):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

O bloco `env` de configuração aceita apenas valores de string literais. Ele não expande
valores `file:...`; por exemplo, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
é passado aos provedores como essa string exata.

Para chaves de provedores baseadas em arquivo, use um SecretRef no campo de credencial que
oferece suporte a isso:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets) e a
[superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) para
os campos compatíveis.

## Importação do ambiente do shell

`env.shellEnv` executa seu shell de login e importa apenas chaves esperadas **ausentes**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalentes de variáveis de ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Snapshots do shell exec

Em hosts do Gateway que não são Windows, comandos `exec` do bash e zsh usam um snapshot de inicialização por padrão.
Defina `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` no ambiente do processo do Gateway para desabilitar esse caminho.
Os valores `false`, `no` e `off` também o desabilitam. Valores `exec.env` por chamada não podem alternar
snapshots nem redirecionar o cache de snapshots.

## Variáveis de ambiente injetadas pelo runtime

O OpenClaw também injeta marcadores de contexto em processos filhos gerados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados pela ferramenta `exec`.
- `OPENCLAW_SHELL=acp`: definido para gerações de processos de backend de runtime ACP (por exemplo, `acpx`).
- `OPENCLAW_SHELL=acp-client`: definido para `openclaw acp client` quando ele gera o processo de ponte ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos de shell `!` da TUI local.
- `OPENCLAW_CLI=1`: definido para processos filhos gerados pelo ponto de entrada da CLI.

Esses são marcadores de runtime (não uma configuração de usuário obrigatória). Eles podem ser usados na lógica de shell/perfil
para aplicar regras específicas ao contexto.

## Variáveis de ambiente da UI

- `OPENCLAW_THEME=light`: força a paleta clara da TUI quando seu terminal tem fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta escura da TUI.
- `COLORFGBG`: se seu terminal a exportar, o OpenClaw usa a dica de cor de fundo para escolher automaticamente a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente em valores de string de configuração usando a sintaxe `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Consulte [Configuração: substituição de variáveis de ambiente](/pt-BR/gateway/configuration-reference#env-var-substitution) para detalhes completos.

## Referências secretas vs strings `${ENV}`

O OpenClaw oferece suporte a dois padrões orientados por ambiente:

- Substituição de string `${VAR}` em valores de configuração.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que oferecem suporte a referências de segredos.

Ambos são resolvidos a partir do ambiente do processo no momento da ativação. Os detalhes de SecretRef são documentados em [Gerenciamento de segredos](/pt-BR/gateway/secrets).
O próprio bloco `env` de configuração não resolve SecretRefs nem valores abreviados
`file:...`.

## Variáveis de ambiente relacionadas a caminhos

| Variável                 | Finalidade                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Substitui o diretório inicial usado para padrões internos de caminho do OpenClaw (`~/.openclaw/`, diretórios de agentes, sessões, credenciais, onboarding do instalador e o checkout dev padrão). Útil ao executar o OpenClaw como um usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`     | Substitui o diretório de estado (padrão `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Substitui o caminho do arquivo de configuração (padrão `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista de caminhos de diretórios onde diretivas `$include` podem resolver arquivos fora do diretório de configuração (padrão: nenhum — `$include` fica confinado ao diretório de configuração). Com expansão de til.                                                         |

## Logs

| Variável                         | Finalidade                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Substitui o nível de log tanto para arquivo quanto para console (por exemplo, `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com um aviso. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emite diagnósticos direcionados de temporização de requisição/resposta do modelo no nível `info` sem habilitar logs globais de debug.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnósticos de payload do modelo: `summary`, `tools` ou `full-redacted`. `full-redacted` é limitado e redigido, mas pode incluir texto de prompt/mensagem.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnósticos de streaming: `events` para temporização inicial/concluída, `peek` para incluir os cinco primeiros eventos SSE redigidos.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnósticos da superfície de modelo do modo de código, incluindo ocultação de ferramentas do provedor e aplicação de somente exec/wait.                                                                                          |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório inicial do sistema (`$HOME` / `os.homedir()`) para padrões internos de caminho do OpenClaw. Isso inclui o diretório de estado padrão, caminho de configuração, diretórios de agentes, credenciais, workspace de onboarding do instalador e o checkout dev padrão usado por `openclaw update --channel dev`.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback de home do Termux `PREFIX` no Android > `os.homedir()`

**Exemplo** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido como um caminho com til (por exemplo, `~/svc`), que é expandido usando a mesma cadeia de fallback de home do SO antes do uso.

Variáveis de caminho explícitas, como `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` e `OPENCLAW_GIT_DIR`, ainda têm precedência. Tarefas da conta do SO, como detecção de arquivos de inicialização do shell, configuração do gerenciador de pacotes e expansão de `~` do host, ainda podem usar o home real do sistema.

## Usuários de nvm: falhas de TLS em web_fetch

Se o Node.js foi instalado via **nvm** (não pelo gerenciador de pacotes do sistema), o `fetch()` integrado usa
o armazenamento de CA empacotado do nvm, que pode não conter CAs raiz modernas (ISRG Root X1/X2 para Let's Encrypt,
DigiCert Global Root G2 etc.). Isso faz com que `web_fetch` falhe com `"fetch failed"` na maioria dos sites HTTPS.

No Linux, o OpenClaw detecta automaticamente o nvm e aplica a correção no ambiente de inicialização real:

- `openclaw gateway install` grava `NODE_EXTRA_CA_CERTS` no ambiente do serviço systemd
- o ponto de entrada da CLI `openclaw` reexecuta a si mesmo com `NODE_EXTRA_CA_CERTS` definido antes da inicialização do Node

**Correção manual (para versões mais antigas ou inicializações diretas com `node ...`):**

Exporte a variável antes de iniciar o OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Não confie em gravar apenas em `~/.openclaw/.env` para esta variável; o Node lê
`NODE_EXTRA_CA_CERTS` na inicialização do processo.

## Variáveis de ambiente legadas

O OpenClaw lê apenas variáveis de ambiente `OPENCLAW_*`. Os prefixos legados
`CLAWDBOT_*` e `MOLTBOT_*` de versões anteriores são ignorados silenciosamente.

Se alguma ainda estiver definida no processo do Gateway na inicialização, o OpenClaw emite um
único aviso de descontinuação do Node (`OPENCLAW_LEGACY_ENV_VARS`) listando os
prefixos detectados e a contagem total. Renomeie cada valor substituindo o
prefixo legado por `OPENCLAW_` (por exemplo, `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); os nomes antigos não têm efeito.

## Relacionados

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [FAQ: variáveis de ambiente e carregamento de .env](/pt-BR/help/faq#env-vars-and-env-loading)
- [Visão geral de modelos](/pt-BR/concepts/models)
