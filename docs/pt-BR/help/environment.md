---
read_when:
    - Você precisa saber quais variáveis de ambiente são carregadas e em que ordem
    - Você está depurando chaves de API ausentes no Gateway
    - Você está documentando autenticação de provedor ou ambientes de implantação
summary: De onde o OpenClaw carrega variáveis de ambiente e a ordem de precedência
title: Variáveis de ambiente
x-i18n:
    generated_at: "2026-04-24T05:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

O OpenClaw obtém variáveis de ambiente de várias fontes. A regra é **nunca sobrescrever valores existentes**.

## Precedência (maior → menor)

1. **Ambiente do processo** (o que o processo do Gateway já recebeu do shell/daemon pai).
2. **`.env` no diretório de trabalho atual** (padrão do dotenv; não sobrescreve).
3. **`.env` global** em `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`; não sobrescreve).
4. **Bloco `env` da configuração** em `~/.openclaw/openclaw.json` (aplicado apenas se estiver faltando).
5. **Importação opcional do shell de login** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), aplicada apenas para chaves esperadas que estiverem faltando.

Em instalações novas do Ubuntu que usam o diretório de estado padrão, o OpenClaw também trata `~/.config/openclaw/gateway.env` como fallback de compatibilidade após o `.env` global. Se ambos os arquivos existirem e divergirem, o OpenClaw mantém `~/.openclaw/.env` e imprime um aviso.

Se o arquivo de configuração estiver totalmente ausente, a etapa 4 será ignorada; a importação do shell ainda será executada se estiver ativada.

## Bloco `env` da configuração

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

## Importação de env do shell

`env.shellEnv` executa seu shell de login e importa apenas chaves esperadas que estiverem **faltando**:

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

Equivalentes em variáveis de ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variáveis de ambiente injetadas em runtime

O OpenClaw também injeta marcadores de contexto em processos-filho iniciados:

- `OPENCLAW_SHELL=exec`: definido para comandos executados pela ferramenta `exec`.
- `OPENCLAW_SHELL=acp`: definido para inicializações de processo do backend de runtime ACP (por exemplo `acpx`).
- `OPENCLAW_SHELL=acp-client`: definido para `openclaw acp client` quando ele inicia o processo bridge do ACP.
- `OPENCLAW_SHELL=tui-local`: definido para comandos locais de shell `!` da TUI.

Esses são marcadores de runtime (não exigem configuração do usuário). Eles podem ser usados em lógica de shell/perfil
para aplicar regras específicas de contexto.

## Variáveis de ambiente da UI

- `OPENCLAW_THEME=light`: força a paleta clara da TUI quando seu terminal tem fundo claro.
- `OPENCLAW_THEME=dark`: força a paleta escura da TUI.
- `COLORFGBG`: se seu terminal exportar isso, o OpenClaw usa a dica de cor de fundo para escolher automaticamente a paleta da TUI.

## Substituição de variáveis de ambiente na configuração

Você pode referenciar variáveis de ambiente diretamente em valores de string da configuração usando a sintaxe `${VAR_NAME}`:

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

Consulte [Configuration: Env var substitution](/pt-BR/gateway/configuration-reference#env-var-substitution) para ver todos os detalhes.

## Secret refs vs strings `${ENV}`

O OpenClaw oferece suporte a dois padrões orientados por env:

- Substituição de string `${VAR}` em valores de configuração.
- Objetos SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) para campos que oferecem suporte a referências de segredos.

Ambos são resolvidos a partir do env do processo no momento da ativação. Detalhes de SecretRef estão documentados em [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Variáveis de ambiente relacionadas a caminho

| Variável              | Finalidade                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Substitui o diretório home usado para toda a resolução interna de caminhos (`~/.openclaw/`, diretórios de agente, sessões, credenciais). Útil ao executar o OpenClaw como um usuário de serviço dedicado. |
| `OPENCLAW_STATE_DIR`  | Substitui o diretório de estado (padrão `~/.openclaw`).                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`| Substitui o caminho do arquivo de configuração (padrão `~/.openclaw/openclaw.json`).                                                                                       |

## Logging

| Variável             | Finalidade                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Substitui o nível de log tanto para arquivo quanto para console (por exemplo `debug`, `trace`). Tem precedência sobre `logging.level` e `logging.consoleLevel` na configuração. Valores inválidos são ignorados com um aviso. |

### `OPENCLAW_HOME`

Quando definido, `OPENCLAW_HOME` substitui o diretório home do sistema (`$HOME` / `os.homedir()`) para toda a resolução interna de caminhos. Isso permite isolamento completo do sistema de arquivos para contas de serviço headless.

**Precedência:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemplo** (LaunchDaemon no macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` também pode ser definido como um caminho com til (`e.g. `~/svc``), que é expandido usando `$HOME` antes do uso.

## Usuários de nvm: falhas TLS em web_fetch

Se o Node.js foi instalado via **nvm** (e não pelo gerenciador de pacotes do sistema), o `fetch()` integrado usa
o armazenamento de CAs incluído pelo nvm, que pode não ter CAs raiz modernas (ISRG Root X1/X2 do Let's Encrypt,
DigiCert Global Root G2 etc.). Isso faz `web_fetch` falhar com `"fetch failed"` na maioria dos sites HTTPS.

No Linux, o OpenClaw detecta automaticamente o nvm e aplica a correção no ambiente real de inicialização:

- `openclaw gateway install` grava `NODE_EXTRA_CA_CERTS` no ambiente do serviço systemd
- o entrypoint da CLI `openclaw` se reexecuta com `NODE_EXTRA_CA_CERTS` definido antes da inicialização do Node

**Correção manual (para versões antigas ou inicializações diretas com `node ...`):**

Exporte a variável antes de iniciar o OpenClaw:
__OC_I18N_900004__
Não dependa apenas de gravar essa variável em `~/.openclaw/.env`; o Node lê
`NODE_EXTRA_CA_CERTS` na inicialização do processo.

## Relacionado

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [FAQ: variáveis de ambiente e carregamento de .env](/pt-BR/help/faq#env-vars-and-env-loading)
- [Visão geral de Models](/pt-BR/concepts/models)
