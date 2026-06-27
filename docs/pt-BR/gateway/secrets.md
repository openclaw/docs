---
read_when:
    - Configurando SecretRefs para credenciais de provedor e refs `auth-profiles.json`
    - Operar recarregamento, auditoria, configuração e aplicação de segredos com segurança em produção
    - Entendendo fail-fast na inicialização, filtragem de superfícies inativas e comportamento do último estado bom conhecido
sidebarTitle: Secrets management
summary: 'Gerenciamento de segredos: contrato SecretRef, comportamento de snapshot em runtime e limpeza unidirecional segura'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-06-27T17:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw oferece suporte a SecretRefs aditivos para que credenciais compatíveis não precisem ser armazenadas como texto simples na configuração.

<Note>
Texto simples ainda funciona. SecretRefs são opcionais por credencial.
</Note>

<Warning>
Credenciais em texto simples continuam legíveis pelo agente se forem armazenadas em arquivos que o
agente possa inspecionar, incluindo `openclaw.json`, `auth-profiles.json`, `.env` ou
arquivos `agents/*/agent/models.json` gerados. SecretRefs reduzem esse raio de impacto
local somente depois que todas as credenciais compatíveis tiverem sido migradas e
`openclaw secrets audit --check` não relatar nenhum resíduo de segredo em texto simples.
</Warning>

## Objetivos e modelo de runtime

Segredos são resolvidos em um snapshot de runtime em memória.

- A resolução é ansiosa durante a ativação, não preguiçosa em caminhos de requisição.
- A inicialização falha rapidamente quando um SecretRef efetivamente ativo não pode ser resolvido.
- O recarregamento usa troca atômica: sucesso total, ou mantém o último snapshot comprovadamente bom.
- Violações da política de SecretRef (por exemplo, perfis de autenticação em modo OAuth combinados com entrada SecretRef) falham a ativação antes da troca de runtime.
- Requisições de runtime leem apenas do snapshot ativo em memória.
- Depois da primeira ativação/carga de configuração bem-sucedida, os caminhos de código de runtime continuam lendo esse snapshot ativo em memória até que um recarregamento bem-sucedido o substitua.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo, entrega de resposta/thread do Discord e envios de ações do Telegram); eles não resolvem SecretRefs novamente a cada envio.

Isso mantém indisponibilidades de provedores de segredo fora dos caminhos quentes de requisição.

## Limite de acesso do agente

SecretRefs protegem credenciais contra persistência em configuração compatível e
superfícies de modelo geradas, mas não são um limite de isolamento de processo. Se uma
credencial em texto simples permanecer em disco em um caminho que o agente possa ler, o agente poderá
contornar a redação em nível de API usando ferramentas de arquivo ou shell para inspecionar esse arquivo.

Para implantações de produção em que arquivos acessíveis pelo agente estejam no escopo, trate
a migração para SecretRef como concluída somente quando tudo isto for verdadeiro:

- credenciais compatíveis usam SecretRefs em vez de valores em texto simples
- resíduos legados em texto simples foram removidos de `openclaw.json`,
  `auth-profiles.json`, `.env` e arquivos `models.json` gerados
- `openclaw secrets audit --check` está limpo após a migração
- quaisquer credenciais restantes sem suporte ou rotativas estão protegidas por isolamento do
  sistema operacional, isolamento de contêiner ou um proxy externo de credenciais

É por isso que o fluxo de auditoria/configuração/aplicação é um gate de migração de segurança, não
apenas um auxiliar de conveniência.

<Warning>
SecretRefs não tornam seguros arquivos arbitrários legíveis. Backups, configurações copiadas,
catálogos de modelos gerados antigos e classes de credenciais sem suporte devem ser tratados
como segredos de produção até serem excluídos, movidos para fora do limite de confiança do agente
ou protegidos por uma camada de isolamento separada.
</Warning>

## Filtragem de superfície ativa

SecretRefs são validados apenas em superfícies efetivamente ativas.

- Superfícies habilitadas: refs não resolvidas bloqueiam inicialização/recarregamento.
- Superfícies inativas: refs não resolvidas não bloqueiam inicialização/recarregamento.
- Refs inativas emitem diagnósticos não fatais com o código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Exemplos de superfícies inativas">
    - Entradas de canal/conta desabilitadas.
    - Credenciais de canal de nível superior que nenhuma conta habilitada herda.
    - Superfícies de ferramenta/recurso desabilitadas.
    - Chaves específicas de provedor de busca na web que não são selecionadas por `tools.web.search.provider`. No modo automático (provedor não definido), as chaves são consultadas por precedência para autodetecção de provedor até que uma seja resolvida. Após a seleção, chaves de provedores não selecionados são tratadas como inativas até serem selecionadas.
    - Material de autenticação SSH do sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, além de substituições por agente) fica ativo somente quando o backend efetivo do sandbox é `ssh` para o agente padrão ou um agente habilitado.
    - SecretRefs de `gateway.remote.token` / `gateway.remote.password` ficam ativos se uma destas condições for verdadeira:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` é `serve` ou `funnel`
      - Em modo local sem essas superfícies remotas:
        - `gateway.remote.token` fica ativo quando a autenticação por token pode vencer e nenhum token de env/auth está configurado.
        - `gateway.remote.password` fica ativo somente quando a autenticação por senha pode vencer e nenhuma senha de env/auth está configurada.
    - O SecretRef de `gateway.auth.token` fica inativo para resolução de autenticação na inicialização quando `OPENCLAW_GATEWAY_TOKEN` está definido, porque a entrada de token por env vence para esse runtime.

  </Accordion>
</AccordionGroup>

## Diagnósticos da superfície de autenticação do Gateway

Quando um SecretRef é configurado em `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, a inicialização/recarregamento do Gateway registra explicitamente o estado da superfície:

- `active`: o SecretRef faz parte da superfície de autenticação efetiva e deve ser resolvido.
- `inactive`: o SecretRef é ignorado para este runtime porque outra superfície de autenticação vence, ou porque a autenticação remota está desabilitada/não ativa.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem o motivo usado pela política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Pré-validação de referência no onboarding

Quando o onboarding é executado em modo interativo e você escolhe armazenamento SecretRef, o OpenClaw executa validação prévia antes de salvar:

- Refs de env: valida o nome da variável de env e confirma que um valor não vazio está visível durante a configuração.
- Refs de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reutilização do quickstart: quando `gateway.auth.token` já é um SecretRef, o onboarding o resolve antes do bootstrap de probe/dashboard (para refs `env`, `file` e `exec`) usando o mesmo gate de falha rápida.

Se a validação falhar, o onboarding mostra o erro e permite tentar novamente.

## Contrato de SecretRef

Use um formato de objeto em todos os lugares:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Campos SecretInput compatíveis também aceitam abreviações de string exatas:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corresponder a `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve ser um ponteiro JSON absoluto (`/...`)
    - Escapamento RFC6901 em segmentos: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corresponder a `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (aceita seletores como `secret#json_key`)
    - `id` não deve conter `.` ou `..` como segmentos de caminho delimitados por barra (por exemplo, `a/../b` é rejeitado)

  </Tab>
</Tabs>

## Configuração de provedor

Defina provedores em `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provedor env">
    - Allowlist opcional via `allowlist`.
    - Valores de env ausentes/vazios falham a resolução.

  </Accordion>
  <Accordion title="Provedor file">
    - Lê o arquivo local de `path`.
    - `mode: "json"` espera um payload de objeto JSON e resolve `id` como ponteiro.
    - `mode: "singleValue"` espera o id de ref `"value"` e retorna o conteúdo do arquivo.
    - O caminho deve passar pelas verificações de propriedade/permissão.
    - Observação de falha fechada no Windows: se a verificação de ACL estiver indisponível para um caminho, a resolução falha. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para contornar verificações de segurança de caminho.

  </Accordion>
  <Accordion title="Provedor exec">
    - Executa o caminho absoluto do binário configurado, sem shell.
    - Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
    - Defina `allowSymlinkCommand: true` para permitir caminhos de comando symlink (por exemplo, shims do Homebrew). O OpenClaw valida o caminho de destino resolvido.
    - Combine `allowSymlinkCommand` com `trustedDirs` para caminhos de gerenciadores de pacotes (por exemplo, `["/opt/homebrew"]`).
    - Oferece suporte a timeout, timeout sem saída, limites de bytes de saída, allowlist de env e diretórios confiáveis.
    - Observação de falha fechada no Windows: se a verificação de ACL estiver indisponível para o caminho do comando, a resolução falha. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para contornar verificações de segurança de caminho.
    - Provedores exec gerenciados por Plugin podem usar `pluginIntegration` em vez de
      `command`/`args` copiados. O OpenClaw resolve os detalhes do comando atual
      a partir do manifesto do Plugin instalado durante a inicialização/recarregamento. Se o Plugin estiver
      desabilitado, removido, não confiável ou não declarar mais a integração,
      SecretRefs ativos que usam esse provedor falham fechados.

    Payload de requisição (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload de resposta (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Erros opcionais por id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Chaves de API baseadas em arquivo

Não coloque strings `file:...` no bloco `env` da configuração. O bloco `env` é
literal e não substitutivo, então `file:...` não é resolvido.

Use um SecretRef de arquivo em um campo de credencial compatível:

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

Para `mode: "singleValue"`, o `id` do SecretRef é `"value"`. Para
`mode: "json"`, use um ponteiro JSON absoluto como
`"/providers/xai/apiKey"`.

Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) para
os campos de configuração que aceitam SecretRefs.

## Exemplos de integração exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Use um wrapper de resolução quando quiser que os ids de SecretRef sejam mapeados para chaves de item do Bitwarden
    Secrets Manager. O repositório inclui
    `scripts/secrets/openclaw-bws-resolver.mjs`; instale-o ou copie-o para um caminho absoluto
    confiável no host que executa o Gateway.

    Requisitos:

    - CLI do Bitwarden Secrets Manager (`bws`) instalado no host do Gateway.
    - `BWS_ACCESS_TOKEN` disponível para o serviço Gateway.
    - `PATH` passado para o resolvedor, ou `BWS_BIN` definido como o caminho absoluto do binário
      `bws`.
    - `BWS_SERVER_URL` deve ser definido no ambiente ao usar uma instância
      auto-hospedada do Bitwarden.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    O resolvedor agrupa os ids solicitados, executa `bws secret list` e retorna
    valores para campos `key` de segredos correspondentes. Use chaves que satisfaçam o contrato de id
    SecretRef de exec, como `openclaw/providers/openai/apiKey`; chaves no
    estilo de variáveis de ambiente com sublinhados são rejeitadas antes da execução do resolvedor. Se mais
    de um segredo visível do Bitwarden tiver a mesma chave solicitada, o resolvedor
    falhará esse id como ambíguo em vez de escolher um. Depois de atualizar a configuração,
    verifique o caminho do resolvedor:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    Use um pequeno wrapper de resolução quando quiser que ids de SecretRef sejam mapeados diretamente para
    entradas `pass`. Salve-o como executável em um caminho absoluto que passe
    nas verificações de caminho do seu provedor exec, por exemplo
    `/usr/local/bin/openclaw-pass-resolver`. O shebang `#!/usr/bin/env node`
    resolve `node` a partir do `PATH` do processo do resolvedor, então inclua `PATH` em
    `passEnv`. Se `pass` não estiver nesse `PATH`, defina `PASS_BIN` no ambiente
    pai e também o inclua em `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Em seguida, configure o provedor exec e aponte `apiKey` para o caminho da entrada
    `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Mantenha o segredo na primeira linha da entrada `pass`, ou personalize o
    wrapper se quiser retornar a saída completa de `pass show`. Depois de
    atualizar a configuração, verifique tanto a auditoria estática quanto o caminho do resolvedor exec:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Variáveis de ambiente do servidor MCP

Variáveis de ambiente do servidor MCP configuradas via `plugins.entries.acpx.config.mcpServers` oferecem suporte a SecretInput. Isso mantém chaves de API e tokens fora da configuração em texto simples:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Valores de string em texto simples ainda funcionam. Referências de modelo de ambiente como `${MCP_SERVER_API_KEY}` e objetos SecretRef são resolvidos durante a ativação do Gateway antes que o processo do servidor MCP seja iniciado. Como em outras superfícies SecretRef, referências não resolvidas só bloqueiam a ativação quando o Plugin `acpx` está efetivamente ativo.

## Material de autenticação SSH do sandbox

O backend de sandbox `ssh` do núcleo também oferece suporte a SecretRefs para material de autenticação SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportamento em tempo de execução:

- O OpenClaw resolve essas refs durante a ativação do sandbox, não preguiçosamente durante cada chamada SSH.
- Valores resolvidos são gravados em arquivos temporários com permissões restritivas e usados na configuração SSH gerada.
- Se o backend de sandbox efetivo não for `ssh`, essas refs permanecem inativas e não bloqueiam a inicialização.

## Superfície de credenciais compatível

Credenciais canônicas compatíveis e incompatíveis são listadas em:

- [Superfície de Credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)

<Note>
Credenciais emitidas em tempo de execução ou rotativas e material de atualização OAuth são intencionalmente excluídos da resolução SecretRef somente leitura.
</Note>

## Comportamento obrigatório e precedência

- Campo sem uma ref: inalterado.
- Campo com uma ref: obrigatório em superfícies ativas durante a ativação.
- Se tanto texto simples quanto ref estiverem presentes, ref tem precedência nos caminhos de precedência compatíveis.
- O sentinela de redação `__OPENCLAW_REDACTED__` é reservado para redação/restauração interna de configuração e é rejeitado como dados literais de configuração enviados.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso em tempo de execução)
- `REF_SHADOWED` (constatação de auditoria quando credenciais de `auth-profiles.json` têm precedência sobre refs de `openclaw.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples.
- O valor em texto simples é ignorado quando a ref irmã está definida.

## Acionadores de ativação

A ativação de segredos é executada em:

- Inicialização (preflight mais ativação final)
- Caminho de aplicação a quente de recarregamento de configuração
- Caminho de verificação de reinicialização de recarregamento de configuração
- Recarregamento manual via `secrets.reload`
- Preflight de RPC de gravação de configuração do Gateway (`config.set` / `config.apply` / `config.patch`) para resolubilidade de SecretRef em superfície ativa dentro do payload de configuração enviado antes de persistir edições

Contrato de ativação:

- Sucesso troca o snapshot atomicamente.
- Falha na inicialização aborta a inicialização do Gateway.
- Falha no recarregamento em tempo de execução mantém o último snapshot sabidamente válido.
- Falha no preflight de RPC de gravação rejeita a configuração enviada e mantém tanto a configuração em disco quanto o snapshot de runtime ativo inalterados.
- Fornecer um token de canal explícito por chamada para uma chamada de helper/ferramenta de saída não aciona a ativação de SecretRef; os pontos de ativação permanecem inicialização, recarregamento e `secrets.reload` explícito.

## Sinais degradados e recuperados

Quando a ativação em tempo de recarregamento falha após um estado íntegro, o OpenClaw entra em estado de segredos degradado.

Evento único do sistema e códigos de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o runtime mantém o último snapshot sabidamente válido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já degradado registram avisos, mas não geram eventos em excesso.
- Falha rápida na inicialização não emite eventos degradados porque o runtime nunca se tornou ativo.

## Resolução de caminho de comando

Caminhos de comando podem optar pela resolução SecretRef compatível via RPC de snapshot do Gateway.

Há dois comportamentos gerais:

<Tabs>
  <Tab title="Caminhos de comando estritos">
    Por exemplo, caminhos de memória remota de `openclaw memory` e `openclaw qr --remote` quando ele precisa de refs de segredo compartilhado remoto. Eles leem a partir do snapshot ativo e falham rapidamente quando uma SecretRef obrigatória está indisponível.
  </Tab>
  <Tab title="Caminhos de comando somente leitura">
    Por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e fluxos somente leitura de reparo de doctor/config. Eles também preferem o snapshot ativo, mas degradam em vez de abortar quando uma SecretRef direcionada está indisponível nesse caminho de comando.

    Comportamento somente leitura:

    - Quando o gateway está em execução, estes comandos leem primeiro a partir do snapshot ativo.
    - Se a resolução do gateway estiver incompleta ou o gateway estiver indisponível, eles tentam um fallback local direcionado para a superfície específica do comando.
    - Se uma SecretRef direcionada ainda estiver indisponível, o comando continua com saída somente leitura degradada e diagnósticos explícitos, como "configurado, mas indisponível neste caminho de comando".
    - Este comportamento degradado é apenas local ao comando. Ele não enfraquece os caminhos de inicialização, recarregamento ou envio/autenticação do runtime.

  </Tab>
</Tabs>

Outras observações:

- A atualização do snapshot após a rotação de segredo no backend é tratada por `openclaw secrets reload`.
- Método RPC do Gateway usado por estes caminhos de comando: `secrets.resolve`.

## Fluxo de trabalho de auditoria e configuração

Fluxo padrão do operador:

<Steps>
  <Step title="Auditar o estado atual">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurar e aplicar SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Auditar novamente">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Não trate a migração como concluída até que a nova auditoria esteja limpa. Se a auditoria
ainda relatar valores em texto claro em repouso, o risco de acesso por agentes ainda estará presente
mesmo quando as APIs de runtime retornarem valores redigidos.

Se você salvar um plano em vez de aplicar durante `configure`, aplique esse plano salvo
com `openclaw secrets apply --from <plan-path>` antes da nova auditoria.

<AccordionGroup>
  <Accordion title="secrets audit">
    As descobertas incluem:

    - valores em texto claro em repouso (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerado)
    - resíduos de cabeçalho sensível de provedor em texto claro em entradas geradas de `models.json`
    - refs não resolvidas
    - sombreamento de precedência (`auth-profiles.json` tendo prioridade sobre refs de `openclaw.json`)
    - resíduos legados (`auth.json`, lembretes de OAuth)

    Observação sobre exec:

    - Por padrão, a auditoria ignora verificações de resolução de SecretRef exec para evitar efeitos colaterais de comando.
    - Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

    Observação sobre resíduos de cabeçalho:

    - A detecção de cabeçalhos sensíveis de provedor é baseada em heurística de nomes (nomes e fragmentos comuns de cabeçalhos de autenticação/credenciais, como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Auxiliar interativo que:

    - configura primeiro `secrets.providers` (`env`/`file`/`exec`, adicionar/editar/remover)
    - permite selecionar campos compatíveis que contêm segredos em `openclaw.json` mais `auth-profiles.json` para um escopo de agente
    - pode criar um novo mapeamento de `auth-profiles.json` diretamente no seletor de destino
    - captura detalhes da SecretRef (`source`, `provider`, `id`)
    - executa resolução de preflight
    - pode aplicar imediatamente

    Observação sobre exec:

    - O preflight ignora verificações de SecretRef exec a menos que `--allow-exec` esteja definido.
    - Se você aplicar diretamente a partir de `configure --apply` e o plano incluir refs/provedores exec, mantenha `--allow-exec` definido também para a etapa de aplicação.

    Modos úteis:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Padrões de aplicação de `configure`:

    - limpar credenciais estáticas correspondentes de `auth-profiles.json` para provedores direcionados
    - limpar entradas estáticas legadas de `api_key` de `auth.json`
    - limpar linhas conhecidas de segredo correspondentes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar um plano salvo:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Observação sobre exec:

    - dry-run ignora verificações de exec a menos que `--allow-exec` esteja definido.
    - o modo de gravação rejeita planos contendo SecretRefs/provedores exec a menos que `--allow-exec` esteja definido.

    Para detalhes do contrato estrito de destino/caminho e regras exatas de rejeição, consulte [Contrato de plano do Secrets Apply](/pt-BR/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de segurança unidirecional

<Warning>
OpenClaw intencionalmente não grava backups de rollback contendo valores históricos de segredo em texto claro.
</Warning>

Modelo de segurança:

- o preflight deve ser bem-sucedido antes do modo de gravação
- a ativação do runtime é validada antes do commit
- a aplicação atualiza arquivos usando substituição atômica de arquivo e restauração de melhor esforço em caso de falha

## Observações de compatibilidade de autenticação legada

Para credenciais estáticas, o runtime não depende mais do armazenamento legado de autenticação em texto claro.

- A origem das credenciais de runtime é o snapshot resolvido em memória.
- Entradas estáticas legadas de `api_key` são limpas quando descobertas.
- O comportamento de compatibilidade relacionado a OAuth permanece separado.

## Observação sobre a Web UI

Algumas uniões de SecretInput são mais fáceis de configurar no modo de editor bruto do que no modo de formulário.

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — configuração de autenticação
- [CLI: secrets](/pt-BR/cli/secrets) — comandos da CLI
- [Variáveis de ambiente](/pt-BR/help/environment) — precedência de ambiente
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) — superfície de credenciais
- [Contrato de plano do Secrets Apply](/pt-BR/gateway/secrets-plan-contract) — detalhes do contrato do plano
- [Segurança](/pt-BR/gateway/security) — postura de segurança
