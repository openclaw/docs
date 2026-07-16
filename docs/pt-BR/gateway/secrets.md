---
read_when:
    - Configurando SecretRefs para credenciais de provedores e refs `auth-profiles.json`
    - Operação segura em produção do recarregamento, da auditoria, da configuração e da aplicação de segredos
    - Entendendo a falha rápida na inicialização, a filtragem de superfícies inativas e o comportamento do último estado válido conhecido
sidebarTitle: Secrets management
summary: 'Gerenciamento de segredos: contrato SecretRef, comportamento do snapshot em tempo de execução e limpeza unidirecional segura'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-07-16T12:34:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

O OpenClaw oferece suporte a SecretRefs aditivas, para que as credenciais compatíveis não precisem permanecer como texto simples na configuração.

<Note>
O texto simples continua funcionando. As SecretRefs são opcionais para cada credencial.
</Note>

<Warning>
As credenciais em texto simples continuam legíveis pelo agente se estiverem em arquivos que ele possa inspecionar, incluindo `openclaw.json`, `auth-profiles.json`, `.env` ou arquivos `agents/*/agent/models.json` gerados. As SecretRefs só reduzem esse raio de impacto local depois que todas as credenciais compatíveis forem migradas e `openclaw secrets audit --check` não relatar nenhum resíduo de texto simples.
</Warning>

## Modelo de runtime

- Os segredos são resolvidos em um snapshot de runtime na memória, de forma antecipada durante a ativação, e não de forma tardia nos caminhos de solicitação.
- A inicialização falha imediatamente quando uma SecretRef efetivamente ativa não pode ser resolvida.
- O recarregamento é uma troca atômica: sucesso completo ou manutenção do último snapshot válido conhecido.
- Violações de política (por exemplo, um perfil de autenticação no modo OAuth combinado com uma entrada SecretRef) fazem a ativação falhar antes da troca do runtime.
- As solicitações de runtime leem somente o snapshot ativo na memória. As credenciais SecretRef de provedores de modelos passam pelo armazenamento de autenticação e pelas opções de streaming como sentinelas locais ao processo até a saída. Os caminhos de entrega de saída (entrega de respostas/threads do Discord e envios de ações do Telegram) também leem esse snapshot e não resolvem novamente as referências a cada envio.

Isso mantém as indisponibilidades dos provedores de segredos fora dos caminhos críticos de solicitação.

## Injeção no momento da saída (sentinelas)

Para credenciais de provedores de modelos respaldadas por SecretRefs, o OpenClaw cria uma sentinela opaca e local ao processo durante a resolução da autenticação do modelo. Dessa forma, o armazenamento de autenticação, as opções de streaming, a configuração do SDK, os logs, os objetos de erro e a maior parte da introspecção do runtime veem um valor como `oc-sent-v1-...`, e não a credencial do provedor. A busca protegida do modelo e as sondagens gerenciadas de integridade de provedores locais substituem sentinelas conhecidas nos valores de URL e cabeçalho imediatamente antes de cada solicitação sair do processo.

Valores desconhecidos com formato de sentinela falham de forma segura antes de qualquer atividade de rede. O OpenClaw se recusa a enviar a solicitação, em vez de encaminhar uma sentinela não resolvida a um provedor. Os valores de segredos resolvidos também são registrados para ocultação de valor exato nos logs como medida de defesa em profundidade.

Os adaptadores de provedores usam o ponto de injeção mais tardio compatível com seu SDK:

- SDKs com uma opção de busca personalizada recebem a busca protegida do OpenClaw, portanto o SDK mantém a sentinela.
- SDKs sem uma opção de busca personalizada desembrulham a sentinela imediatamente antes da criação do cliente. Streams de provedores pertencentes a Plugins e ambientes de agentes desembrulham no último ponto de transferência pertencente ao núcleo, pois esses transportes não compartilham a busca protegida do OpenClaw.

As sentinelas reduzem a exposição de texto simples em toda a cadeia de chamadas do modelo, mas não constituem isolamento de processo. O valor real ainda existe na memória do mesmo processo e aparece no limite final do adaptador. Credenciais simples de ambiente que não estejam configuradas por meio de SecretRefs permanecem em texto simples e estão fora desse mecanismo.

Defina `OPENCLAW_SECRET_SENTINELS=off` (também aceita `0` ou `false`, sem distinção entre maiúsculas e minúsculas) para desativar a criação de sentinelas durante a resposta a incidentes ou a solução de problemas de compatibilidade. O mecanismo de desativação não desabilita o registro para ocultação de valores exatos.

## Limite de acesso do agente

As SecretRefs impedem que as credenciais sejam persistidas na configuração e nos arquivos de modelos gerados, mas não constituem um limite de isolamento de processo. Uma credencial em texto simples deixada no disco em um caminho que o agente possa ler ainda pode ser acessada por ferramentas de arquivo ou shell, contornando a ocultação no nível da API.

Para implantações de produção em que arquivos acessíveis pelo agente estejam no escopo, considere a migração concluída somente quando todas estas condições forem atendidas:

- As credenciais compatíveis usam SecretRefs em vez de valores em texto simples.
- Os resíduos legados de texto simples foram removidos de `openclaw.json`, `auth-profiles.json`, `.env` e dos arquivos `models.json` gerados.
- `openclaw secrets audit --check` não apresenta problemas após a migração.
- Todas as credenciais restantes, incompatíveis ou rotativas, são protegidas por isolamento do sistema operacional, isolamento de contêiner ou um proxy externo de credenciais.

É por isso que o fluxo de auditoria/configuração/aplicação é uma barreira de segurança para a migração, e não apenas um recurso auxiliar de conveniência.

<Warning>
As SecretRefs não tornam arquivos arbitrários legíveis seguros. Backups, configurações copiadas, catálogos antigos de modelos gerados e classes de credenciais incompatíveis continuam sendo segredos de produção até que sejam excluídos, movidos para fora do limite de confiança do agente ou isolados separadamente.
</Warning>

## Filtragem de superfícies ativas

As SecretRefs são validadas somente em superfícies efetivamente ativas:

- **Superfícies habilitadas**: referências não resolvidas bloqueiam a inicialização/o recarregamento.
- **Superfícies inativas**: referências não resolvidas não bloqueiam a inicialização/o recarregamento; elas emitem um diagnóstico não fatal `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Exemplos de superfícies inativas">
- Entradas de canais/contas desabilitadas.
- Credenciais de canais de nível superior que não são herdadas por nenhuma conta habilitada.
- Superfícies de ferramentas/recursos desabilitadas.
- Chaves específicas de provedores de pesquisa na Web não selecionadas por `tools.web.search.provider`. No modo automático (provedor não definido), as chaves são consultadas por ordem de precedência para detecção automática até que uma seja resolvida; após a seleção, as chaves dos provedores não selecionados ficam inativas.
- O material de autenticação SSH do sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, além das substituições por agente) fica ativo somente quando o backend efetivo do sandbox é `ssh` e o modo do sandbox não é `off`, para o agente padrão ou um agente habilitado.
- As SecretRefs `gateway.remote.token` / `gateway.remote.password` ficam ativas se qualquer uma destas condições for atendida:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` é `serve` ou `funnel`
  - No modo local sem essas superfícies remotas: `gateway.remote.token` fica ativo quando a autenticação por token pode prevalecer e nenhum token de ambiente/autenticação está configurado; `gateway.remote.password` fica ativo somente quando a autenticação por senha pode prevalecer e nenhuma senha de ambiente/autenticação está configurada.
- A SecretRef `gateway.auth.token` fica inativa para a resolução da autenticação durante a inicialização quando `OPENCLAW_GATEWAY_TOKEN` está definido, pois a entrada do token de ambiente prevalece nesse runtime.

</Accordion>

## Diagnósticos da superfície de autenticação do Gateway

Quando uma SecretRef é definida em `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, a inicialização/o recarregamento do Gateway registra o estado da superfície com o código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: a SecretRef faz parte da superfície efetiva de autenticação e deve ser resolvida.
- `inactive`: outra superfície de autenticação prevalece, ou a autenticação remota está desabilitada/inativa.

A entrada de log inclui o motivo usado pela política de superfícies ativas.

## Verificação preliminar de referências na integração inicial

Na integração inicial interativa, escolher o armazenamento SecretRef executa uma validação preliminar antes de salvar:

- Referências de ambiente: valida o nome da variável de ambiente e confirma que um valor não vazio está visível durante a configuração.
- Referências de provedores (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Fluxo de início rápido: quando `gateway.auth.token` já é uma SecretRef, a integração inicial a resolve antes da sondagem/inicialização do painel (para referências `env`, `file` e `exec`) usando a mesma barreira de falha imediata.

Uma falha de validação exibe o erro e permite tentar novamente.

## Contrato de SecretRef

Um único formato de objeto em todos os lugares:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Strings abreviadas também são aceitas em campos SecretInput:

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
    - `id` deve ser um ponteiro JSON absoluto (`/...`) ou o literal `value` para provedores `singleValue`
    - Escape RFC 6901 nos segmentos: `~` se torna `~0`, `/` se torna `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corresponder a `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (aceita seletores como `secret#json_key`)
    - `id` não deve conter `.` nem `..` como segmentos de caminho delimitados por barras (por exemplo, `a/../b` é rejeitado)

  </Tab>
</Tabs>

## Configuração de provedores

Defina os provedores em `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // ou "singleValue"
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

<Accordion title="Provedor de ambiente">
- Lista de permissões opcional de nomes exatos por meio de `allowlist`.
- Valores de ambiente ausentes ou vazios fazem a resolução falhar.

</Accordion>

<Accordion title="Provedor de arquivos">
- Lê o arquivo local em `path`.
- `mode: "json"` (padrão) espera um payload de objeto JSON e resolve `id` como um ponteiro JSON.
- `mode: "singleValue"` espera o ID de referência `"value"` e retorna o conteúdo bruto do arquivo (com a quebra de linha final removida).
- O caminho deve passar pelas verificações de propriedade/permissão; `timeoutMs` (padrão de 5000) e `maxBytes` (padrão de 1 MiB) limitam a leitura.
- Falha segura no Windows: se a verificação da ACL não estiver disponível para o caminho, a resolução falhará. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação.

</Accordion>

<Accordion title="Provedor exec">
- Executa diretamente o caminho absoluto do binário configurado, sem shell.
- Por padrão, `command` deve ser um arquivo comum, não um link simbólico. Defina `allowSymlinkCommand: true` para permitir caminhos de comando com links simbólicos (por exemplo, shims do Homebrew) e combine essa opção com `trustedDirs` (por exemplo, `["/opt/homebrew"]`) para que apenas caminhos de gerenciadores de pacotes sejam aceitos.
- Oferece suporte a `timeoutMs` (padrão 5000), `noOutputTimeoutMs` (por padrão, igual a `timeoutMs`), `maxOutputBytes` (padrão 1 MiB), lista de permissões de `env`/`passEnv` e `trustedDirs`.
- `jsonOnly` tem como padrão `true`. Com `jsonOnly: false` e um único id solicitado, uma saída stdout simples que não seja JSON é aceita como o valor desse id.
- Falha fechada no Windows: se a verificação de ACL não estiver disponível para o caminho do comando, a resolução falhará. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação.
- Provedores exec gerenciados por plugins podem usar `pluginIntegration` em vez de `command`/`args` copiados. O OpenClaw resolve os detalhes atuais do comando a partir do manifesto do plugin instalado durante a inicialização/recarga; se o plugin estiver desabilitado, tiver sido removido, não for confiável ou não declarar mais a integração, SecretRefs ativos nesse provedor falharão de forma fechada.

Payload da solicitação (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload da resposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: segredo da lista de permissões
```

Erros opcionais por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` é um diagnóstico opcional legível por máquina. O OpenClaw exibe os códigos reconhecidos
`NOT_FOUND` e `AMBIGUOUS_DUPLICATE_KEY` com o provedor e o id da referência. Outros
códigos e campos de formato livre, como `message`, são aceitos para compatibilidade com o protocolo v1,
mas não são exibidos porque a saída do resolvedor pode conter material de credenciais.

</Accordion>

## Chaves de API armazenadas em arquivo

Não coloque strings `file:...` no bloco `env` da configuração. Esse bloco é literal e não permite substituição, portanto `file:...` nunca é resolvido nele.

Em vez disso, use uma SecretRef de arquivo em um campo de credencial compatível:

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

Para `mode: "singleValue"`, a `id` da SecretRef é `"value"`. Para `mode: "json"`, use um ponteiro JSON absoluto, como `"/providers/xai/apiKey"`.

Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) para ver os campos que aceitam SecretRefs.

## Exemplos de integração exec

Para consultar um guia dedicado do 1Password que aborda contas de serviço, a skill de agente incluída e solução de problemas, consulte [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI do 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew com links simbólicos
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
    Use um wrapper de resolvedor para mapear ids de SecretRef para chaves de itens do Bitwarden Secrets Manager. O repositório inclui `scripts/secrets/openclaw-bws-resolver.mjs`; instale-o ou copie-o para um caminho absoluto confiável no host que executa o Gateway.

    Requisitos:

    - CLI do Bitwarden Secrets Manager (`bws`) instalada no host do Gateway.
    - `BWS_ACCESS_TOKEN` disponível para o serviço do Gateway.
    - `PATH` passado ao resolvedor ou `BWS_BIN` definido como o caminho absoluto do binário `bws`.
    - `BWS_SERVER_URL` definido no ambiente ao usar uma instância auto-hospedada do Bitwarden.

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

    O resolvedor agrupa os ids solicitados, executa `bws secret list` e retorna valores para os campos `key` de segredos correspondentes. Use chaves que atendam ao contrato de id da SecretRef exec, como `openclaw/providers/openai/apiKey`; chaves no estilo de variáveis de ambiente com sublinhados são rejeitadas antes da execução do resolvedor. Se mais de um segredo visível do Bitwarden compartilhar a chave solicitada, o resolvedor fará esse id falhar por ambiguidade em vez de fazer uma suposição. Após atualizar a configuração, verifique o caminho do resolvedor:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI do HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew com links simbólicos
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
    Use um pequeno wrapper de resolvedor para mapear ids de SecretRef diretamente para entradas `pass`. Salve-o como um executável em um caminho absoluto que passe pelas verificações de caminho do provedor exec, por exemplo, `/usr/local/bin/openclaw-pass-resolver`. O shebang `#!/usr/bin/env node` resolve `node` a partir do `PATH` do processo do resolvedor, portanto inclua `PATH` em `passEnv`. Se `pass` não estiver nesse `PATH`, defina `PASS_BIN` no ambiente pai e também o inclua em `passEnv`:

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
        process.stderr.write(`Falha ao analisar a solicitação: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass encerrou com o status ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Em seguida, configure o provedor exec e aponte `apiKey` para o caminho da entrada `pass`:

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

    Mantenha o segredo na primeira linha da entrada `pass` ou personalize o wrapper para retornar a saída completa de `pass show`. Após atualizar a configuração, verifique tanto a auditoria estática quanto o caminho do resolvedor exec:

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
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew com links simbólicos
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

As variáveis de ambiente do servidor MCP configuradas por meio de `plugins.entries.acpx.config.mcpServers` aceitam SecretInput, mantendo chaves de API e tokens fora da configuração em texto simples:

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

Valores de string em texto simples continuam funcionando. Referências de modelo de ambiente, como `${MCP_SERVER_API_KEY}`, e objetos SecretRef são resolvidos durante a ativação do gateway, antes que o processo do servidor MCP seja iniciado. Assim como em outras superfícies de SecretRef, referências não resolvidas somente bloqueiam a ativação quando o plugin `acpx` está efetivamente ativo.

## Material de autenticação SSH do sandbox

O backend de sandbox principal `ssh` também oferece suporte a SecretRefs para material de autenticação SSH:

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

- O OpenClaw resolve essas referências durante a ativação do sandbox, não de forma tardia a cada chamada SSH.
- Os valores resolvidos são gravados em um diretório temporário com permissões de arquivo restritivas (`0o600`) e usados na configuração SSH gerada.
- Se o backend efetivo do sandbox não for `ssh` (ou o modo do sandbox for `off`), essas referências permanecem inativas e não bloqueiam a inicialização.

## Superfície de credenciais compatível

As credenciais canônicas compatíveis e não compatíveis estão listadas em [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).

<Note>
Credenciais geradas em tempo de execução ou rotativas e materiais de atualização OAuth são intencionalmente excluídos da resolução SecretRef somente leitura.
</Note>

## Comportamento obrigatório e precedência

- Campo sem referência: permanece inalterado.
- Campo com referência: obrigatório nas superfícies ativas durante a ativação.
- Se o texto simples e a referência estiverem presentes, a referência terá precedência nos caminhos de precedência compatíveis.
- O sentinela de ocultação `__OPENCLAW_REDACTED__` é reservado para ocultação/restauração interna da configuração e é rejeitado como dado literal de configuração enviado.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso em tempo de execução)
- `REF_SHADOWED` (constatação de auditoria quando as credenciais `auth-profiles.json` têm precedência sobre as referências `openclaw.json`)

Compatibilidade com Google Chat: `serviceAccountRef` tem precedência sobre o texto simples `serviceAccount`; o valor em texto simples é ignorado assim que a referência correspondente é definida.

## Gatilhos de ativação

A ativação de segredos é executada em:

- Inicialização (pré-verificação e ativação final)
- Caminho de aplicação dinâmica do recarregamento da configuração
- Caminho de verificação de reinicialização do recarregamento da configuração
- Recarregamento manual por meio de `secrets.reload`
- Pré-verificação da RPC de gravação da configuração do Gateway (`config.set` / `config.apply` / `config.patch`), que verifica a capacidade de resolução de SecretRefs das superfícies ativas na carga útil de configuração enviada antes de persistir as alterações

Contrato de ativação:

- Em caso de sucesso, o snapshot é substituído atomicamente.
- Uma falha na inicialização interrompe a inicialização do Gateway.
- Uma falha de recarregamento em tempo de execução mantém o último snapshot válido conhecido.
- Uma falha na pré-verificação da RPC de gravação rejeita a configuração enviada; tanto a configuração em disco quanto o snapshot ativo em tempo de execução permanecem inalterados.
- Fornecer um token de canal explícito por chamada a uma chamada de auxiliar/ferramenta de saída não aciona a ativação de SecretRef; os pontos de ativação continuam sendo a inicialização, o recarregamento e `secrets.reload` explícito.

## Sinais de degradação e recuperação

Quando a ativação durante o recarregamento falha após um estado íntegro, o OpenClaw entra no estado de segredos degradado, emitindo eventos de sistema únicos e códigos de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o tempo de execução mantém o último snapshot válido conhecido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto o estado já está degradado registram avisos, mas não emitem o evento novamente.
- A interrupção imediata na inicialização nunca emite um evento de degradação, pois o tempo de execução nunca chegou a ficar ativo.

## Resolução de caminhos de comando

Os caminhos de comando podem optar pela resolução SecretRef compatível por meio de uma RPC de snapshot do Gateway. Dois comportamentos gerais se aplicam:

<Tabs>
  <Tab title="Caminhos de comando estritos">
    Por exemplo, os caminhos de memória remota `openclaw memory` e `openclaw qr --remote` quando precisam de referências remotas de segredo compartilhado. Eles leem o snapshot ativo e falham imediatamente quando uma SecretRef obrigatória não está disponível.
  </Tab>
  <Tab title="Caminhos de comando somente leitura">
    Por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e os fluxos somente leitura de reparo de configuração/doctor. Eles também preferem o snapshot ativo, mas operam de forma degradada, em vez de interromper, quando uma SecretRef específica não está disponível.

    Comportamento somente leitura:

    - Quando o Gateway está em execução, esses comandos leem primeiro o snapshot ativo.
    - Se a resolução pelo Gateway estiver incompleta ou o Gateway estiver indisponível, eles tentam uma alternativa local direcionada para essa superfície de comando.
    - Se uma SecretRef específica continuar indisponível, o comando prossegue com saída somente leitura degradada e um diagnóstico explícito de que a referência está configurada, mas indisponível nesse caminho de comando.
    - Esse comportamento degradado é apenas local ao comando; ele não enfraquece os caminhos de inicialização, recarregamento, envio ou autenticação do tempo de execução.

  </Tab>
</Tabs>

Outras observações:

- A atualização do snapshot após a rotação de segredos do backend é realizada por `openclaw secrets reload`.
- Método RPC do Gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de auditoria e configuração

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

Não considere a migração concluída até que a nova auditoria não apresente problemas. Se a auditoria ainda relatar valores em texto simples armazenados, o risco de acesso pelo agente permanecerá, mesmo quando as APIs de tempo de execução retornarem valores ocultados.

Se você salvar um plano em vez de aplicá-lo durante `configure`, aplique esse plano salvo com `openclaw secrets apply --from <plan-path>` antes da nova auditoria.

<AccordionGroup>
  <Accordion title="secrets audit">
    As constatações incluem:

    - Valores em texto simples armazenados (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerado).
    - Resíduos de cabeçalhos sensíveis de provedores em texto simples nas entradas `models.json` geradas.
    - Referências não resolvidas.
    - Sombreamento por precedência (`auth-profiles.json` tendo prioridade sobre as referências `openclaw.json`).
    - Resíduos legados (`auth.json`, lembretes de OAuth).

    Observação sobre exec: por padrão, a auditoria ignora as verificações de capacidade de resolução de SecretRefs exec para evitar efeitos colaterais dos comandos. Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

    Observação sobre resíduos de cabeçalhos: a detecção de cabeçalhos sensíveis de provedores é baseada em heurísticas de nomes (nomes comuns de cabeçalhos de autenticação/credenciais e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Auxiliar interativo que:

    - Configura primeiro `secrets.providers` (`env`/`file`/`exec`, adicionar/editar/remover).
    - Permite selecionar campos compatíveis que contêm segredos em `openclaw.json`, além de `auth-profiles.json`, para o escopo de um agente.
    - Pode criar um novo mapeamento `auth-profiles.json` diretamente no seletor de destino.
    - Captura os detalhes da SecretRef (`source`, `provider`, `id`).
    - Executa a resolução de pré-verificação e pode aplicar imediatamente.

    Observação sobre exec: a pré-verificação ignora as verificações de SecretRef exec, a menos que `--allow-exec` esteja definido. Se você aplicar diretamente de `configure --apply` e o plano incluir referências/provedores exec, mantenha `--allow-exec` definido também na etapa de aplicação.

    Modos úteis:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Padrões de aplicação de `configure`:

    - Remove credenciais estáticas correspondentes de `auth-profiles.json` para os provedores selecionados.
    - Remove entradas estáticas legadas `api_key` de `auth.json`.
    - Remove linhas de segredos conhecidas correspondentes de `<config-dir>/.env`.

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar um plano salvo:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Observação sobre exec: a simulação ignora as verificações exec, a menos que `--allow-exec` esteja definido; o modo de gravação rejeita planos que contenham SecretRefs/provedores exec, a menos que `--allow-exec` esteja definido.

    Para obter detalhes do contrato estrito de destino/caminho e as regras exatas de rejeição, consulte [Contrato do plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de segurança unidirecional

<Warning>
O OpenClaw intencionalmente não grava backups de reversão que contenham valores históricos de segredos em texto simples.
</Warning>

Modelo de segurança:

- A pré-verificação deve ser bem-sucedida antes do modo de gravação.
- A ativação em tempo de execução é validada antes da confirmação.
- A aplicação atualiza os arquivos usando substituição atômica de arquivos e restauração de melhor esforço em caso de falha.

## Observações sobre compatibilidade com autenticação legada

Para credenciais estáticas, o tempo de execução não depende mais do armazenamento legado de autenticação em texto simples.

- A fonte de credenciais do tempo de execução é o snapshot resolvido em memória.
- As entradas estáticas legadas `api_key` são removidas quando encontradas.
- O comportamento de compatibilidade relacionado ao OAuth permanece separado.

## Observação sobre a interface Web

Algumas uniões SecretInput são mais fáceis de configurar no modo de editor bruto do que no modo de formulário.

## Relacionados

- [Autenticação](/pt-BR/gateway/authentication) - configuração da autenticação
- [CLI: segredos](/pt-BR/cli/secrets) - comandos da CLI
- [SecretRefs do Vault](/pt-BR/plugins/vault) - configuração do provedor HashiCorp Vault
- [Variáveis de ambiente](/pt-BR/help/environment) - precedência do ambiente
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) - superfície de credenciais
- [Contrato do plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract) - detalhes do contrato do plano
- [Segurança](/pt-BR/gateway/security) - postura de segurança
