---
read_when:
    - Você executou `clawhub package validate` e precisa corrigir os problemas encontrados no plugin
    - O ClawHub rejeitou ou emitiu um aviso sobre a publicação de um pacote de plugin
    - Você está atualizando os metadados do pacote do plugin antes do lançamento
summary: Corrija os problemas encontrados na validação do pacote do Plugin ClawHub antes da publicação
title: Correções de validação de Plugins
x-i18n:
    generated_at: "2026-07-12T15:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correções de validação de plugins

O ClawHub valida pacotes de plugins antes da publicação e também pode exibir constatações de
verificações automatizadas de pacotes. Esta página aborda constatações voltadas aos autores, ou seja,
constatações que o autor do plugin pode corrigir nos metadados do pacote, no manifesto, nas importações
do SDK ou no artefato publicado.

Ela não aborda constatações internas de cobertura do Plugin Inspector. Se um relatório completo
contiver códigos de manutenção do verificador sem orientações de correção para o autor, eles
se destinam aos mantenedores do OpenClaw, não aos autores de plugins.

Após aplicar qualquer correção, execute novamente:

```bash
clawhub package validate <path-to-plugin>
```

## Constatações voltadas aos autores

| Código                                  | Comece aqui                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Adicione os metadados do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Adicione o bloco openclaw do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Declare os pontos de entrada do pacote OpenClaw](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publique o ponto de entrada declarado](/pt-BR/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Complete os metadados de instalação](/pt-BR/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Declare a compatibilidade com a API de plugins](/pt-BR/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Alinhe a versão mínima do host](/pt-BR/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Alinhe as versões do pacote e do manifesto](/pt-BR/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Remova metadados de pacote OpenClaw não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Torne o artefato npm empacotável](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Inclua os pontos de entrada na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Inclua os metadados na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Adicione um nome de exibição ao manifesto](/pt-BR/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Remova campos de manifesto não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Remova chaves de contrato não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Substitua as importações do SDK raiz](/pt-BR/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Remova importações reservadas do SDK](/pt-BR/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Substitua o acesso ao armazenamento completo de sessões](/pt-BR/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Substitua as gravações no armazenamento completo de sessões](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Substitua os auxiliares de caminho de arquivo de sessão](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Substitua os destinos legados de arquivos de transcrição](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Substitua os auxiliares de baixo nível para transcrições](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Substitua before_agent_start](/pt-BR/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Mova as variáveis de ambiente do provedor para os metadados de configuração](/pt-BR/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Replique as variáveis de ambiente do canal nos metadados atuais](/pt-BR/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Remova referências indisponíveis ao esquema do manifesto de segurança](/pt-BR/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Remova arquivos de manifesto de segurança não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadados do pacote

### package-json-missing

A raiz do pacote não inclui `package.json`, portanto o ClawHub não consegue identificar o
pacote npm, a versão, os pontos de entrada ou os metadados do OpenClaw.

- Adicione `package.json` com `name`, `version` e `type`.
- Adicione um bloco `openclaw` quando o pacote distribuir um plugin do OpenClaw.
- Use [Criação de plugins](/pt-BR/plugins/building-plugins) para ver um exemplo mínimo de pacote
  e [Manifesto do plugin](/pt-BR/plugins/manifest#manifest-versus-packagejson)
  para entender a separação entre pacote e manifesto.
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-openclaw-metadata-missing

O pacote tem `package.json`, mas não declara os metadados de pacote do
OpenClaw.

- Adicione `package.json#openclaw`.
- Inclua metadados de ponto de entrada, como `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Adicione metadados de compatibilidade e instalação quando o pacote for publicado ou
  instalado por meio do ClawHub.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-openclaw-entry-missing

Os metadados do pacote existem, mas não declaram um ponto de entrada de execução do
OpenClaw.

- Adicione `openclaw.extensions` para pontos de entrada nativos do plugin.
- Adicione `openclaw.runtimeExtensions` quando o pacote publicado precisar carregar
  JavaScript compilado.
- Mantenha todos os caminhos dos pontos de entrada dentro do diretório do pacote.
- Consulte [Pontos de entrada do plugin](/pt-BR/plugins/sdk-entrypoints) e
  [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-entrypoint-missing

O pacote declara um ponto de entrada do OpenClaw, mas o arquivo referenciado não está presente
no pacote que está sendo validado.

- Verifique cada caminho em `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compile o pacote se o ponto de entrada for gerado em `dist`.
- Atualize os metadados se o ponto de entrada tiver sido movido.
- Consulte [Pontos de entrada do plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-install-metadata-incomplete

O ClawHub não consegue determinar como o pacote deve ser instalado ou atualizado.

- Preencha `openclaw.install` com a origem de instalação compatível, como
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Defina `openclaw.install.defaultChoice` quando houver mais de uma origem de instalação
  disponível.
- Use `openclaw.install.minHostVersion` para a versão mínima do host OpenClaw.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-plugin-api-compat-missing

O pacote não declara o intervalo da API de plugins do OpenClaw com o qual é compatível.

- Adicione `openclaw.compat.pluginApi` ao `package.json`.
- Use a versão da API de plugins do OpenClaw ou a versão semver mínima com a qual você compilou
  e realizou testes.
- Mantenha isso separado da versão do pacote. A versão do pacote descreve a
  versão do plugin; `openclaw.compat.pluginApi` descreve o contrato da API do host.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-min-host-version-drift

A versão mínima do host do pacote não corresponde aos metadados de versão do OpenClaw
usados para compilar o pacote.

- Verifique `openclaw.install.minHostVersion`.
- Verifique todos os metadados de compilação do OpenClaw no pacote, como a versão do OpenClaw
  usada durante a publicação.
- Alinhe a versão mínima do host ao intervalo de versões do host com o qual o pacote
  realmente é compatível.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-manifest-version-drift

A versão do pacote e a versão do manifesto do plugin são divergentes.

- Prefira `package.json#version` como a versão de lançamento do pacote.
- Se `openclaw.plugin.json` também tiver `version`, atualize-a para corresponder ou remova
  os metadados obsoletos de versão do manifesto quando os metadados do pacote forem a fonte autoritativa.
- Publique uma nova versão do pacote após alterar metadados já publicados.
- Consulte [Manifesto do plugin](/pt-BR/plugins/manifest).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-openclaw-unsupported-metadata

O bloco `package.json#openclaw` contém campos que não são metadados de pacote
compatíveis com o OpenClaw.

- Remova campos não compatíveis, como `openclaw.bundle`.
- Mantenha os metadados do plugin nativo em `openclaw.plugin.json`.
- Mantenha os metadados de pontos de entrada, compatibilidade, instalação, configuração e catálogo
  nos campos compatíveis de `package.json#openclaw`.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute `clawhub package validate <path-to-plugin>` novamente.

## Artefato publicado

### package-npm-pack-unavailable

O pacote não pode ser empacotado no artefato que o ClawHub inspecionaria ou
publicaria.

- Execute `npm pack --dry-run` a partir da raiz do pacote.
- Corrija metadados de pacote inválidos, scripts de ciclo de vida com falha ou entradas de arquivos que
  impeçam o empacotamento.
- Remova `private: true` se este pacote se destinar à publicação pública.
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-npm-pack-entrypoint-missing

O pacote pode ser empacotado, mas o artefato empacotado não inclui os
arquivos de ponto de entrada declarados em `package.json#openclaw`.

- Execute `npm pack --dry-run` e inspecione os arquivos que seriam incluídos.
- Compile os pontos de entrada gerados antes do empacotamento.
- Atualize `files`, `.npmignore` ou a saída da compilação para que os pontos de entrada declarados sejam
  incluídos.
- Consulte [Pontos de entrada do plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute `clawhub package validate <path-to-plugin>` novamente.

### package-npm-pack-metadata-missing

O artefato empacotado não contém metadados do OpenClaw existentes no pacote
de origem.

- Execute `npm pack --dry-run` e inspecione os arquivos de metadados incluídos.
- Garanta que `package.json` inclua o bloco `openclaw` no artefato empacotado.
- Garanta que `openclaw.plugin.json` seja incluído quando o pacote for um plugin
  nativo do OpenClaw.
- Atualize `files` ou `.npmignore` para que os metadados do pacote não sejam excluídos.
- Consulte [Criação de plugins](/pt-BR/plugins/building-plugins).
- Execute `clawhub package validate <path-to-plugin>` novamente.

## Metadados do manifesto

### manifest-name-missing

O manifesto nativo do plugin não inclui um nome de exibição.

- Adicione um campo `name` não vazio ao `openclaw.plugin.json`.
- Mantenha `name` legível para humanos e `id` como o identificador estável para máquinas.
- Consulte [Manifesto do plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

O manifesto do plugin contém campos de nível superior que o OpenClaw não aceita.

- Compare cada campo de nível superior com a
  [referência de campos do manifesto](/pt-BR/plugins/manifest#top-level-field-reference).
- Remova os campos personalizados do `openclaw.plugin.json`.
- Mova os metadados de pacote ou instalação para campos compatíveis de `package.json#openclaw`,
  em vez de incluí-los no manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

O manifesto declara chaves incompatíveis dentro de `contracts`.

- Compare cada chave em `contracts` com a
  [referência de contratos](/pt-BR/plugins/manifest#contracts-reference).
- Remova as chaves de contrato incompatíveis.
- Mova o comportamento de runtime para o código de registro do plugin e limite `contracts`
  aos metadados estáticos de propriedade de recursos.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Migração de SDK e compatibilidade

### legacy-root-sdk-import

O plugin faz importações pelo barrel raiz obsoleto do SDK:
`openclaw/plugin-sdk`.

- Substitua as importações do barrel raiz por importações de subcaminhos públicos específicos.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para os auxiliares de ponto de entrada de canais.
- Use [Convenções de importação](/pt-BR/plugins/building-plugins#import-conventions) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths) para encontrar a importação mais específica.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

O plugin importa um caminho do SDK reservado para plugins integrados ou para
compatibilidade interna.

- Substitua as importações reservadas do SDK interno do OpenClaw por subcaminhos públicos
  documentados de `openclaw/plugin-sdk/*`.
- Se o comportamento não tiver um SDK público, mantenha o auxiliar dentro do seu pacote ou
  solicite uma API pública do OpenClaw.
- Use [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration) para escolher uma importação compatível.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

O plugin ainda usa o auxiliar obsoleto para o armazenamento completo de sessões,
`loadSessionStore`.

- Use `getSessionEntry(...)` ou `listSessionEntries(...)` ao ler o estado da
  sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` ao gravar o estado da
  sessão.
- Evite carregar, modificar e salvar o objeto completo de armazenamento de sessões.
- Mantenha `loadSessionStore(...)` somente enquanto o intervalo de compatibilidade declarado
  ainda incluir versões anteriores do OpenClaw que o exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

O plugin ainda usa um auxiliar obsoleto de gravação do armazenamento completo de sessões, como
`saveSessionStore` ou `updateSessionStore`.

- Use `patchSessionEntry(...)` ao atualizar campos em uma entrada de sessão
  existente.
- Use `upsertSessionEntry(...)` ao substituir ou criar uma entrada de sessão.
- Evite carregar, modificar e salvar o objeto completo de armazenamento de sessões.
- Mantenha os auxiliares de gravação do armazenamento completo somente enquanto o intervalo de compatibilidade declarado
  ainda incluir versões anteriores do OpenClaw que os exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

O plugin ainda usa auxiliares obsoletos de caminho de arquivo de sessão, como
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Use `getSessionEntry(...)` para ler os metadados da sessão pela identidade do agente e da
  sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para persistir os metadados da
  sessão.
- Use auxiliares de identidade ou destino de transcrição quando o código estiver preparando uma
  operação de transcrição.
- Não persista nem dependa de caminhos de arquivos de transcrição legados.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

O plugin ainda usa o auxiliar obsoleto de destino de arquivo de transcrição,
`resolveSessionTranscriptLegacyFileTarget`.

- Use `resolveSessionTranscriptIdentity(...)` quando o código precisar somente da identidade pública
  da sessão.
- Use `resolveSessionTranscriptTarget(...)` quando o código precisar de um destino estruturado
  para uma operação de transcrição.
- Evite ler ou construir diretamente destinos legados de arquivos de transcrição.
- Mantenha o auxiliar legado somente enquanto o intervalo de compatibilidade declarado ainda
  incluir versões anteriores do OpenClaw que o exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

O plugin ainda usa auxiliares obsoletos de transcrição de baixo nível, como
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Use `appendSessionTranscriptMessageByIdentity(...)` para adicionar conteúdo às transcrições.
- Use `publishSessionTranscriptUpdateByIdentity(...)` para notificações de atualização de
  transcrição.
- Prefira a interface estruturada de runtime para transcrições, para que o OpenClaw possa aplicar os
  limites corretos das transações e o tratamento correto das identidades.
- Mantenha os auxiliares de transcrição de baixo nível somente enquanto o intervalo de compatibilidade declarado
  ainda incluir versões anteriores do OpenClaw que os exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

O plugin ainda usa o hook legado `before_agent_start`.

- Mova o trabalho de substituição de modelo ou provedor para `before_model_resolve`.
- Mova o trabalho de modificação de prompt ou contexto para `before_prompt_build`.
- Mantenha `before_agent_start` somente enquanto o intervalo de compatibilidade declarado ainda
  incluir versões anteriores do OpenClaw que o exigem.
- Consulte [Hooks](/pt-BR/plugins/hooks) e
  [Compatibilidade de plugins](/pt-BR/plugins/compatibility).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

O manifesto ainda usa os metadados legados de autenticação do provedor `providerAuthEnvVars`.

- Replique os metadados de variáveis de ambiente do provedor em `setup.providers[].envVars`.
- Mantenha `providerAuthEnvVars` somente como metadados de compatibilidade enquanto o intervalo
  compatível do OpenClaw ainda exigir seu uso.
- Consulte [Referência de setup](/pt-BR/plugins/manifest#setup-reference) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

O manifesto usa metadados legados ou antigos de variáveis de ambiente do canal sem os metadados atuais
de setup ou configuração esperados pelo ClawHub.

- Mantenha os metadados de variáveis de ambiente do canal de forma declarativa para que o OpenClaw possa inspecionar o status do setup
  sem carregar o runtime do canal.
- Replique o setup do canal orientado por variáveis de ambiente nos metadados atuais de setup, configuração do canal ou
  pacote do canal usados pela estrutura do seu plugin.
- Mantenha `channelEnvVars` somente como metadados de compatibilidade enquanto versões anteriores compatíveis
  do OpenClaw ainda exigirem seu uso.
- Consulte [Manifesto do plugin](/pt-BR/plugins/manifest) e
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Manifesto de segurança

### security-manifest-schema-unavailable

O pacote inclui `openclaw.security.json` com uma referência de esquema que o ClawHub
não reconhece como disponível.

- Remova a URL do esquema se ela for apenas informativa.
- Use um esquema versionado documentado somente depois que o OpenClaw publicar um.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

O pacote inclui um arquivo de manifesto de segurança incompatível.

- Remova `openclaw.security.json` até que o OpenClaw documente um esquema versionado de manifesto de
  segurança e o comportamento do ClawHub.
- Mantenha o comportamento relevante para a segurança documentado na documentação pública do seu pacote ou no
  README até que o contrato do manifesto exista.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Conteúdo relacionado

- [CLI do ClawHub](/pt-BR/clawhub/cli)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto do plugin](/pt-BR/plugins/manifest)
- [Pontos de entrada de plugins](/pt-BR/plugins/sdk-entrypoints)
- [Compatibilidade de plugins](/pt-BR/plugins/compatibility)
