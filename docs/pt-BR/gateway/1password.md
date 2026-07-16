---
read_when:
    - Você quer manter as chaves de API fora do openclaw.json e dentro do 1Password
    - Você executa o Gateway sem interface gráfica e precisa de autenticação de conta de serviço para op
    - Você quer que os agentes leiam ou injetem segredos com a CLI do op
summary: Resolva os segredos do Gateway com a CLI do 1Password e permita que os agentes usem a skill 1password incluída
title: 1Password
x-i18n:
    generated_at: "2026-07-16T12:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

O OpenClaw se integra ao **1Password** de duas maneiras independentes:

- **Segredos de configuração:** qualquer campo [SecretRef](/pt-BR/gateway/secrets) em `openclaw.json` pode ser resolvido em tempo de execução por meio da CLI `op`, portanto as chaves de API nunca ficam no arquivo de configuração.
- **Fluxos de trabalho dos agentes:** a skill `1password` incluída ensina os agentes a iniciar sessão e ler ou injetar segredos com `op` em suas próprias tarefas.

## Requisitos

- A [CLI do 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) instalada no host do Gateway (`brew install 1password-cli` no macOS).
- Um modo de autenticação para `op`:
  - **Conta de serviço** (recomendada para Gateways sem interface gráfica): exporte `OP_SERVICE_ACCOUNT_TOKEN` no ambiente do serviço do Gateway. Não exige aplicativo de desktop nem início de sessão interativo.
  - **Integração com o aplicativo de desktop**: o aplicativo 1Password é executado na mesma máquina com a integração da CLI habilitada. As primeiras chamadas podem acionar o Touch ID ou a autenticação do sistema.
  - **Início de sessão autônomo**: `op signin` solicita autenticação a cada sessão. É viável para agentes por meio da skill, mas não é adequado para resolver segredos de configuração em um Gateway sem interface gráfica.

## Resolver segredos de configuração com op

Declare um provedor de segredos exec que execute `op read` com uma referência `op://vault/item/field` e, em seguida, aponte para ele qualquer campo compatível com SecretRef:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // obrigatório para binários instalados pelo Homebrew por meio de links simbólicos
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

Como as partes se encaixam:

- `command` deve ser um caminho absoluto; `trustedDirs` marca seu diretório como confiável, e `allowSymlinkCommand` é necessário porque o Homebrew instala `op` como um link simbólico.
- `args` transmite a referência `op://vault/item/field` literalmente. O OpenClaw não analisa o esquema `op://`; o binário `op` o resolve.
- `passEnv` encaminha as variáveis listadas do ambiente do Gateway. A integração com o aplicativo de desktop precisa de `HOME`; as contas de serviço também precisam que `OP_SERVICE_ACCOUNT_TOKEN` esteja presente no ambiente do serviço do Gateway (adicione-o a `passEnv` ou defina-o por meio de `env` somente se aceitar que o token fique legível no arquivo de configuração).
- Para uma saída de valor único, mantenha `id: "value"`. Com `jsonOnly: true` e uma carga JSON, referencie os campos usando um id de ponteiro JSON.
- Uma entrada de provedor por segredo mantém as referências auditáveis; nomeie os provedores de acordo com seus consumidores (`onepassword_openai`, `onepassword_telegram`).

Consulte [Segredos do Gateway](/pt-BR/gateway/secrets) para conhecer a ordem de resolução, o armazenamento em cache e a semântica de falhas, e [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) para ver todos os campos que aceitam SecretRefs.

## Configuração de conta de serviço para Gateways sem interface gráfica

1. Crie uma conta de serviço na sua conta do 1Password e conceda a ela acesso de leitura somente aos itens do cofre necessários ao Gateway.
2. Forneça `OP_SERVICE_ACCOUNT_TOKEN` ao serviço do Gateway (plist do launchd, unidade do systemd ou variável de ambiente do contêiner).
3. Adicione `"OP_SERVICE_ACCOUNT_TOKEN"` à lista `passEnv` do provedor.
4. Verifique no ambiente do host do Gateway: `op whoami` deve exibir a conta de serviço sem solicitar autenticação.

As leituras de contas de serviço exigem que o cofre seja nomeado explicitamente na referência `op://`. Restrinja rigorosamente o escopo da conta; ela é uma credencial ao portador.

## A skill 1password para agentes

O OpenClaw inclui uma skill `1password` que transforma os agentes em operadores competentes de `op`: ela detecta o modo de autenticação disponível (conta de serviço, integração com o aplicativo de desktop ou início de sessão autônomo), verifica o acesso com `op whoami` antes de qualquer leitura e prefere `op run` / `op inject` em vez de gravar valores secretos no disco. A skill requer o binário `op` e oferece a instalação pelo Homebrew quando ele não está disponível.

Os agentes a utilizam em seus próprios fluxos de trabalho, por exemplo, para ler um token de implantação durante uma tarefa ou injetar variáveis de ambiente em um comando. Ela é independente da resolução de segredos de configuração; o Gateway resolve SecretRefs sem o envolvimento de nenhuma skill.

## Observações de segurança

- Os valores secretos resolvidos por meio de provedores exec permanecem na memória do Gateway; os instantâneos de configuração e as respostas `config.get` ocultam os campos SecretRef.
- Nunca coloque valores secretos em `openclaw.json`, logs ou chats. Mantenha os nomes dos itens na configuração e os valores no 1Password.
- A trilha de auditoria do 1Password mostra cada leitura feita pela conta de serviço, tornando práticas a rotação de chaves e a análise de incidentes.

## Solução de problemas

- `command not found` ou erros de criação do processo: use o caminho absoluto de `op` e inclua seu diretório em `trustedDirs`.
- `op` é resolvido, mas as leituras falham com erros de link simbólico: defina `allowSymlinkCommand: true` para instalações pelo Homebrew.
- `account is not signed in`: para contas de serviço, confirme que `OP_SERVICE_ACCOUNT_TOKEN` chega ao serviço do Gateway e está listado em `passEnv`; para a integração com o aplicativo de desktop, confirme que o aplicativo está em execução e desbloqueado.
- Primeiras leituras lentas: aumente `timeoutMs` no provedor; inicializações a frio de `op` podem exceder tempos limite estritos em hosts ocupados.
