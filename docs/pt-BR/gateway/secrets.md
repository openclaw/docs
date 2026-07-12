---
read_when:
    - Configurando SecretRefs para credenciais de provedores e referências `auth-profiles.json`
    - Operar o recarregamento, a auditoria, a configuração e a aplicação de segredos com segurança em produção
    - Entendendo a falha imediata na inicialização, a filtragem de superfícies inativas e o comportamento do último estado válido conhecido
sidebarTitle: Secrets management
summary: 'Gerenciamento de segredos: contrato de SecretRef, comportamento do snapshot em tempo de execução e remoção segura e unidirecional de dados confidenciais'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-07-12T15:18:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

O OpenClaw oferece suporte a SecretRefs aditivas, para que as credenciais compatíveis não precisem permanecer como texto simples na configuração.

<Note>
O texto simples continua funcionando. As SecretRefs são opcionais para cada credencial.
</Note>

<Warning>
As credenciais em texto simples continuam legíveis pelo agente se estiverem em arquivos que ele possa inspecionar, incluindo `openclaw.json`, `auth-profiles.json`, `.env` ou arquivos `agents/*/agent/models.json` gerados. As SecretRefs só reduzem esse raio de impacto local depois que todas as credenciais compatíveis forem migradas e `openclaw secrets audit --check` não relatar nenhum resíduo em texto simples.
</Warning>

## Modelo de runtime

- Os segredos são resolvidos em um snapshot de runtime na memória, antecipadamente durante a ativação, não de forma tardia nos caminhos de solicitação.
- A inicialização falha imediatamente quando uma SecretRef efetivamente ativa não pode ser resolvida.
- O recarregamento é uma troca atômica: sucesso completo ou manutenção do último snapshot válido conhecido.
- Violações de política (por exemplo, um perfil de autenticação no modo OAuth combinado com uma entrada SecretRef) fazem a ativação falhar antes da troca do runtime.
- As solicitações de runtime leem apenas o snapshot ativo na memória. As credenciais SecretRef dos provedores de modelo passam pelo armazenamento de autenticação e pelas opções de streaming como sentinelas locais ao processo até a saída. Os caminhos de entrega de saída (entrega de respostas/threads no Discord, envios de ações no Telegram) também leem esse snapshot e não resolvem novamente as referências a cada envio.

Isso mantém as indisponibilidades dos provedores de segredos fora dos caminhos críticos de solicitação.

## Injeção no momento da saída (sentinelas)

Para credenciais de provedores de modelo respaldadas por SecretRefs, o OpenClaw gera uma sentinela opaca e local ao processo durante a resolução da autenticação do modelo. Portanto, o armazenamento de autenticação, as opções de streaming, a configuração do SDK, os logs, os objetos de erro e a maior parte da introspecção do runtime veem um valor como `oc-sent-v1-...`, não a credencial do provedor. A busca protegida do modelo e as sondagens de integridade gerenciadas dos provedores locais substituem as sentinelas conhecidas nos valores de URL e cabeçalho imediatamente antes que cada solicitação saia do processo.

Valores desconhecidos com formato de sentinela falham de forma segura antes de qualquer atividade de rede. O OpenClaw se recusa a enviar a solicitação em vez de encaminhar uma sentinela não resolvida a um provedor. Os valores de segredos resolvidos também são registrados para ocultação de valores exatos nos logs como medida de defesa em profundidade.

Os adaptadores de provedor usam o ponto de injeção mais tardio compatível com seus SDKs:

- SDKs com uma opção de busca personalizada recebem a busca protegida do OpenClaw, para que o SDK mantenha a sentinela.
- SDKs sem uma opção de busca personalizada desembrulham a sentinela imediatamente antes da criação do cliente. Os streams de provedores pertencentes a Plugins e os harnesses de agentes desembrulham no ponto final de transferência pertencente ao núcleo, pois esses transportes não compartilham a busca protegida do OpenClaw.

As sentinelas reduzem a exposição de texto simples em toda a cadeia de chamada do modelo, mas não constituem isolamento de processo. O valor real ainda existe na memória do mesmo processo e aparece no limite final do adaptador. Credenciais simples de ambiente que não estejam configuradas por meio de SecretRefs permanecem como texto simples e ficam fora desse mecanismo.

Defina `OPENCLAW_SECRET_SENTINELS=off` (também aceita `0` ou `false`, sem diferenciar maiúsculas de minúsculas) para desabilitar a geração de sentinelas durante a resposta a incidentes ou a solução de problemas de compatibilidade. O mecanismo de desativação não desabilita o registro de ocultação por valor exato.

## Limite de acesso do agente

As SecretRefs impedem que credenciais sejam persistidas na configuração e nos arquivos de modelo gerados, mas não constituem um limite de isolamento de processo. Uma credencial em texto simples deixada no disco em um caminho que o agente possa ler continua legível por ferramentas de arquivo ou shell, contornando a ocultação no nível da API.

Em implantações de produção nas quais arquivos acessíveis pelo agente estejam no escopo, considere a migração concluída somente quando todas estas condições forem atendidas:

- As credenciais compatíveis usam SecretRefs em vez de valores em texto simples.
- O resíduo legado em texto simples foi removido de `openclaw.json`, `auth-profiles.json`, `.env` e dos arquivos `models.json` gerados.
- `openclaw secrets audit --check` não apresenta problemas após a migração.
- Quaisquer credenciais restantes, sem suporte ou rotativas, são protegidas por isolamento do sistema operacional, isolamento de contêiner ou um proxy externo de credenciais.

Por isso, o fluxo de auditoria/configuração/aplicação é uma barreira de migração de segurança, não apenas um recurso auxiliar de conveniência.

<Warning>
As SecretRefs não tornam seguros arquivos arbitrários que possam ser lidos. Backups, configurações copiadas, catálogos de modelos antigos gerados e classes de credenciais sem suporte continuam sendo segredos de produção até serem excluídos, movidos para fora do limite de confiança do agente ou isolados separadamente.
</Warning>

## Filtragem de superfícies ativas

As SecretRefs são validadas apenas em superfícies efetivamente ativas:

- **Superfícies habilitadas**: referências não resolvidas bloqueiam a inicialização/o recarregamento.
- **Superfícies inativas**: referências não resolvidas não bloqueiam a inicialização/o recarregamento; elas emitem um diagnóstico não fatal `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Exemplos de superfícies inativas">
- Entradas de canal/conta desabilitadas.
- Credenciais de canal de nível superior que nenhuma conta habilitada herda.
- Superfícies de ferramentas/recursos desabilitadas.
- Chaves específicas de provedores de pesquisa na web não selecionadas por `tools.web.search.provider`. No modo automático (provedor não definido), as chaves são consultadas por ordem de precedência para detecção automática até que uma seja resolvida; após a seleção, as chaves dos provedores não selecionados ficam inativas.
- O material de autenticação SSH do sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, além das substituições por agente) fica ativo somente quando o backend efetivo do sandbox é `ssh` e o modo do sandbox não é `off`, para o agente padrão ou um agente habilitado.
- As SecretRefs `gateway.remote.token` / `gateway.remote.password` ficam ativas se qualquer uma destas condições for atendida:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` é `serve` ou `funnel`
  - No modo local sem essas superfícies remotas: `gateway.remote.token` fica ativo quando a autenticação por token pode prevalecer e nenhum token de ambiente/autenticação está configurado; `gateway.remote.password` fica ativo somente quando a autenticação por senha pode prevalecer e nenhuma senha de ambiente/autenticação está configurada.
- A SecretRef `gateway.auth.token` fica inativa para a resolução da autenticação na inicialização quando `OPENCLAW_GATEWAY_TOKEN` está definido, pois a entrada do token de ambiente prevalece nesse runtime.

</Accordion>

## Diagnósticos da superfície de autenticação do Gateway

Quando uma SecretRef é definida em `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, a inicialização/o recarregamento do Gateway registra o estado da superfície sob o código `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: a SecretRef faz parte da superfície efetiva de autenticação e deve ser resolvida.
- `inactive`: outra superfície de autenticação prevalece, ou a autenticação remota está desabilitada/inativa.

A entrada de log inclui o motivo usado pela política de superfície ativa.

## Pré-verificação de referências durante a integração inicial

Na integração inicial interativa, escolher o armazenamento por SecretRef executa uma validação preliminar antes de salvar:

- Referências de ambiente: valida o nome da variável de ambiente e confirma que um valor não vazio está visível durante a configuração.
- Referências de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
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

    Strings abreviadas também são aceitas nos campos SecretInput:

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
    - Escape RFC 6901 em segmentos: `~` torna-se `~0`, `/` torna-se `~1`

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

<Accordion title="Provedor de ambiente">
- Lista de permissões opcional de nomes exatos por meio de `allowlist`.
- Valores de ambiente ausentes ou vazios fazem a resolução falhar.

</Accordion>

<Accordion title="Provedor de arquivo">
- Lê o arquivo local em `path`.
- `mode: "json"` (padrão) espera um payload de objeto JSON e resolve `id` como um ponteiro JSON.
- `mode: "singleValue"` espera o id de referência `"value"` e retorna o conteúdo bruto do arquivo (com a quebra de linha final removida).
- O caminho deve passar pelas verificações de propriedade/permissão; `timeoutMs` (padrão 5000) e `maxBytes` (padrão 1 MiB) limitam a leitura.
- Falha segura no Windows: se a verificação de ACL não estiver disponível para o caminho, a resolução falha. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação.

</Accordion>

<Accordion title="Provedor de execução">
- Executa diretamente o caminho absoluto do binário configurado, sem shell.
- Por padrão, `command` deve ser um arquivo regular, não um link simbólico. Defina `allowSymlinkCommand: true` para permitir caminhos de comando com links simbólicos (por exemplo, shims do Homebrew) e combine-o com `trustedDirs` (por exemplo, `["/opt/homebrew"]`) para que apenas caminhos de gerenciadores de pacotes sejam aceitos.
- Aceita `timeoutMs` (padrão 5000), `noOutputTimeoutMs` (por padrão, igual a `timeoutMs`), `maxOutputBytes` (padrão 1 MiB), lista de permissões `env`/`passEnv` e `trustedDirs`.
- `jsonOnly` usa `true` por padrão. Com `jsonOnly: false` e um único id solicitado, uma saída stdout simples que não seja JSON é aceita como valor desse id.
- Falha segura no Windows: se a verificação de ACL não estiver disponível para o caminho do comando, a resolução falha. Somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação.
- Provedores de execução gerenciados por Plugins podem usar `pluginIntegration` em vez de um `command`/`args` copiado. O OpenClaw resolve os detalhes atuais do comando a partir do manifesto do Plugin instalado durante a inicialização/o recarregamento; se o Plugin estiver desabilitado, for removido, não for confiável ou não declarar mais a integração, as SecretRefs ativas nesse provedor falham de forma segura.

Payload da solicitação (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload da resposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erros opcionais por id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` é um diagnóstico opcional legível por máquina. O OpenClaw exibe os códigos
reconhecidos `NOT_FOUND` e `AMBIGUOUS_DUPLICATE_KEY` com o provedor e o id da referência. Outros
códigos e campos de formato livre, como `message`, são aceitos para compatibilidade com o protocolo v1,
mas não são exibidos porque a saída do resolvedor pode conter material de credenciais.

</Accordion>

## Chaves de API armazenadas em arquivos

Não coloque strings `file:...` no bloco `env` da configuração. Esse bloco é literal e não substitui valores existentes, portanto `file:...` nunca é resolvido nele.

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

Para `mode: "singleValue"`, o `id` da SecretRef é `"value"`. Para `mode: "json"`, use um ponteiro JSON absoluto, como `"/providers/xai/apiKey"`.

Consulte [Superfície de credenciais da SecretRef](/pt-BR/reference/secretref-credential-surface) para ver os campos que aceitam SecretRefs.

## Exemplos de integração exec

<AccordionGroup>
  <Accordion title="CLI do 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew vinculados por links simbólicos
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
    Use um wrapper de resolução para mapear os ids de SecretRef para as chaves dos itens do Bitwarden Secrets Manager. O repositório inclui `scripts/secrets/openclaw-bws-resolver.mjs`; instale-o ou copie-o para um caminho absoluto confiável no host que executa o Gateway.

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

    O resolvedor agrupa os ids solicitados em lotes, executa `bws secret list` e retorna os valores dos campos `key` correspondentes dos segredos. Use chaves que atendam ao contrato de id da SecretRef exec, como `openclaw/providers/openai/apiKey`; chaves no estilo de variáveis de ambiente com sublinhados são rejeitadas antes da execução do resolvedor. Se mais de um segredo visível do Bitwarden tiver a chave solicitada, o resolvedor indicará falha desse id por ambiguidade, em vez de tentar adivinhar. Após atualizar a configuração, verifique o caminho do resolvedor:

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
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew vinculados por links simbólicos
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
    Use um pequeno wrapper de resolução para mapear os ids de SecretRef diretamente para entradas do `pass`. Salve-o como um executável em um caminho absoluto que passe nas verificações de caminho do provedor exec, por exemplo, `/usr/local/bin/openclaw-pass-resolver`. O shebang `#!/usr/bin/env node` resolve `node` a partir do `PATH` do processo do resolvedor, portanto inclua `PATH` em `passEnv`. Se `pass` não estiver nesse `PATH`, defina `PASS_BIN` no ambiente pai e também o inclua em `passEnv`:

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

    Em seguida, configure o provedor exec e aponte `apiKey` para o caminho da entrada do `pass`:

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

    Mantenha o segredo na primeira linha da entrada do `pass` ou personalize o wrapper para retornar a saída completa de `pass show`. Após atualizar a configuração, verifique tanto a auditoria estática quanto o caminho do resolvedor exec:

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
            allowSymlinkCommand: true, // obrigatório para binários do Homebrew vinculados por links simbólicos
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

Valores de string em texto simples continuam funcionando. Referências de modelo de ambiente, como `${MCP_SERVER_API_KEY}`, e objetos SecretRef são resolvidos durante a ativação do gateway, antes que o processo do servidor MCP seja iniciado. Assim como em outras superfícies de SecretRef, referências não resolvidas só bloqueiam a ativação quando o plugin `acpx` está efetivamente ativo.

## Material de autenticação SSH do sandbox

O backend de sandbox `ssh` do núcleo também é compatível com SecretRefs para material de autenticação SSH:

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

- O OpenClaw resolve essas referências durante a ativação do sandbox, não de forma adiada a cada chamada SSH.
- Os valores resolvidos são gravados em um diretório temporário com permissões de arquivo restritivas (`0o600`) e usados na configuração SSH gerada.
- Se o backend de sandbox efetivo não for `ssh` (ou o modo de sandbox for `off`), essas referências permanecerão inativas e não bloquearão a inicialização.

## Superfície de credenciais compatível

As credenciais canônicas compatíveis e não compatíveis estão listadas em [Superfície de credenciais da SecretRef](/pt-BR/reference/secretref-credential-surface).

<Note>
Credenciais geradas em tempo de execução ou rotativas e material de atualização OAuth são intencionalmente excluídos da resolução de SecretRef somente leitura.
</Note>

## Comportamento obrigatório e precedência

- Campo sem referência: inalterado.
- Campo com referência: obrigatório em superfícies ativas durante a ativação.
- Se houver texto simples e referência, a referência terá precedência nos caminhos de precedência compatíveis.
- O sentinela de redação `__OPENCLAW_REDACTED__` é reservado para redação/restauração interna da configuração e é rejeitado como dado literal enviado na configuração.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso em tempo de execução)
- `REF_SHADOWED` (constatação de auditoria quando as credenciais de `auth-profiles.json` têm precedência sobre as referências de `openclaw.json`)

Compatibilidade com o Google Chat: `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples; o valor em texto simples é ignorado assim que a referência irmã é definida.

## Acionadores de ativação

A ativação de segredos é executada em:

- Inicialização (pré-verificação mais ativação final)
- Caminho de aplicação dinâmica de recarregamento da configuração
- Caminho de verificação de reinicialização do recarregamento da configuração
- Recarregamento manual por meio de `secrets.reload`
- Pré-verificação de RPC de gravação da configuração do Gateway (`config.set` / `config.apply` / `config.patch`), verificando a capacidade de resolução das SecretRefs de superfícies ativas dentro da carga de configuração enviada antes de persistir as edições

Contrato de ativação:

- Em caso de sucesso, o snapshot é substituído atomicamente.
- Uma falha na inicialização interrompe a inicialização do gateway.
- Uma falha de recarregamento em tempo de execução mantém o último snapshot válido conhecido.
- Uma falha na pré-verificação da RPC de gravação rejeita a configuração enviada; tanto a configuração em disco quanto o snapshot ativo em tempo de execução permanecem inalterados.
- Fornecer um token de canal explícito por chamada a uma chamada de ferramenta/auxiliar de saída não aciona a ativação de SecretRef; os pontos de ativação continuam sendo a inicialização, o recarregamento e `secrets.reload` explícito.

## Sinais de degradação e recuperação

Quando a ativação durante o recarregamento falha após um estado íntegro, o OpenClaw entra em um estado degradado de segredos, emitindo eventos de sistema de ocorrência única e códigos de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o runtime mantém o último snapshot válido conhecido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já estiver degradado registram avisos, mas não emitem o evento novamente.
- Uma falha imediata na inicialização nunca emite um evento de degradação, porque o runtime nunca chegou a ficar ativo.

## Resolução de caminhos de comandos

Os caminhos de comandos podem optar pela resolução de SecretRef compatível por meio de uma RPC de snapshot do Gateway. Aplicam-se dois comportamentos gerais:

<Tabs>
  <Tab title="Caminhos de comandos estritos">
    Por exemplo, os caminhos de memória remota de `openclaw memory` e `openclaw qr --remote` quando precisam de refs de segredo compartilhado remoto. Eles leem o snapshot ativo e falham imediatamente quando uma SecretRef obrigatória não está disponível.
  </Tab>
  <Tab title="Caminhos de comandos somente leitura">
    Por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e fluxos somente leitura de reparo do doctor/config. Eles também preferem o snapshot ativo, mas operam de forma degradada em vez de abortar quando uma SecretRef específica não está disponível.

    Comportamento somente leitura:

    - Quando o Gateway está em execução, esses comandos leem primeiro o snapshot ativo.
    - Se a resolução do Gateway estiver incompleta ou o Gateway estiver indisponível, eles tentam um fallback local direcionado para a superfície desse comando.
    - Se uma SecretRef específica continuar indisponível, o comando prossegue com uma saída somente leitura degradada e um diagnóstico explícito de que a ref está configurada, mas indisponível nesse caminho de comando.
    - Esse comportamento degradado é apenas local ao comando; ele não enfraquece os caminhos de inicialização, recarregamento ou envio/autenticação do runtime.

  </Tab>
</Tabs>

Outras observações:

- A atualização do snapshot após a rotação de segredos no backend é realizada por `openclaw secrets reload`.
- Método RPC do Gateway usado por esses caminhos de comandos: `secrets.resolve`.

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

Não considere a migração concluída até que a nova auditoria não apresente problemas. Se a auditoria ainda relatar valores em texto simples armazenados, o risco de acesso pelo agente permanecerá mesmo quando as APIs do runtime retornarem valores ocultados.

Se você salvar um plano em vez de aplicá-lo durante `configure`, aplique esse plano salvo com `openclaw secrets apply --from <plan-path>` antes da nova auditoria.

<AccordionGroup>
  <Accordion title="secrets audit">
    As constatações incluem:

    - Valores em texto simples armazenados (`openclaw.json`, `auth-profiles.json`, `.env` e os arquivos `agents/*/agent/models.json` gerados).
    - Resíduos de cabeçalhos sensíveis de provedores em texto simples nas entradas geradas de `models.json`.
    - Refs não resolvidas.
    - Sombreamento de precedência (`auth-profiles.json` tendo prioridade sobre as refs de `openclaw.json`).
    - Resíduos legados (`auth.json`, lembretes de OAuth).

    Observação sobre exec: por padrão, a auditoria ignora verificações de resolubilidade de SecretRefs exec para evitar efeitos colaterais dos comandos. Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

    Observação sobre resíduos de cabeçalhos: a detecção de cabeçalhos sensíveis de provedores é baseada em heurísticas de nomes (nomes comuns de cabeçalhos de autenticação/credenciais e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Assistente interativo que:

    - Configura primeiro `secrets.providers` (`env`/`file`/`exec`, adicionar/editar/remover).
    - Permite selecionar campos compatíveis que contêm segredos em `openclaw.json`, além de `auth-profiles.json`, para o escopo de um agente.
    - Pode criar um novo mapeamento de `auth-profiles.json` diretamente no seletor de destino.
    - Captura os detalhes da SecretRef (`source`, `provider`, `id`).
    - Executa a resolução de pré-verificação e pode aplicar imediatamente.

    Observação sobre exec: a pré-verificação ignora as verificações de SecretRefs exec, a menos que `--allow-exec` esteja definido. Se você aplicar diretamente por meio de `configure --apply` e o plano incluir refs/provedores exec, mantenha `--allow-exec` definido também para a etapa de aplicação.

    Modos úteis:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Padrões de aplicação de `configure`:

    - Remover de `auth-profiles.json` as credenciais estáticas correspondentes dos provedores selecionados.
    - Remover de `auth.json` as entradas estáticas legadas de `api_key`.
    - Remover de `<config-dir>/.env` as linhas de segredos conhecidos correspondentes.

  </Accordion>
  <Accordion title="secrets apply">
    Aplique um plano salvo:

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
- A ativação do runtime é validada antes da confirmação.
- A aplicação atualiza os arquivos usando substituição atômica e tenta restaurá-los em caso de falha.

## Observações sobre compatibilidade com autenticação legada

Para credenciais estáticas, o runtime não depende mais do armazenamento de autenticação legada em texto simples.

- A fonte de credenciais do runtime é o snapshot resolvido em memória.
- As entradas estáticas legadas de `api_key` são removidas quando detectadas.
- O comportamento de compatibilidade relacionado ao OAuth permanece separado.

## Observação sobre a interface Web

Algumas uniões de SecretInput são mais fáceis de configurar no modo de editor bruto do que no modo de formulário.

## Relacionados

- [Autenticação](/pt-BR/gateway/authentication) - configuração de autenticação
- [CLI: segredos](/pt-BR/cli/secrets) - comandos da CLI
- [SecretRefs do Vault](/pt-BR/plugins/vault) - configuração do provedor HashiCorp Vault
- [Variáveis de ambiente](/pt-BR/help/environment) - precedência de ambiente
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) - superfície de credenciais
- [Contrato do plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract) - detalhes do contrato do plano
- [Segurança](/pt-BR/gateway/security) - postura de segurança
