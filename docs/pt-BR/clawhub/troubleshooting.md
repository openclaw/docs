---
read_when:
    - Falha nos comandos da CLI do ClawHub ou do registro do OpenClaw
    - Um pacote não pode ser instalado, publicado nem atualizado
summary: Solução de problemas de login, instalação, publicação, atualização e API do ClawHub.
x-i18n:
    generated_at: "2026-07-11T23:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solução de problemas

## `clawhub login` abre um navegador, mas nunca é concluído

A CLI inicia um servidor local de callback de curta duração durante o login pelo navegador.

- Verifique se o navegador consegue acessar `http://127.0.0.1:<port>/callback`.
- Verifique as regras locais de firewall, VPN e proxy caso o callback nunca chegue.
- Em ambientes sem interface gráfica, crie um token de API na interface web do ClawHub e execute:

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` retorna `Unauthorized` (401)

- Entre novamente com `clawhub login`.
- Se você usa um caminho de configuração personalizado, confirme se `CLAWHUB_CONFIG_PATH` aponta para o arquivo que contém seu token atual.
- Se você usa um token de API, confirme se ele não foi revogado na interface web.

## A busca ou instalação retorna `Rate limit exceeded` (429)

Leia as informações sobre nova tentativa na resposta:

- `Retry-After`: segundos que devem ser aguardados antes de tentar novamente.
- `RateLimit-Limit`: o limite aplicado a esta solicitação.
- `RateLimit-Remaining`: sua cota restante exata quando o cabeçalho está presente. Em uma resposta `429`, o valor é `0`.
- `RateLimit-Reset` ou `X-RateLimit-Reset`: momento da redefinição.

Se muitos usuários compartilham o mesmo IP de saída, os limites de IP para acesso anônimo podem ser atingidos mesmo que cada pessoa envie apenas algumas solicitações. Entre na sua conta quando possível e tente novamente após o intervalo informado.

## A busca ou instalação falha por trás de um proxy

A CLI respeita as variáveis de proxy padrão:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Os nomes compatíveis incluem `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e `http_proxy`.

## Uma Skill não aparece na busca

- Verifique o slug exato ou a página do proprietário, caso você os conheça.
- Confirme se a versão é pública e não está retida por verificação ou moderação.
- Se você é o proprietário da Skill, entre na sua conta e inspecione-a:

```bash
clawhub inspect @openclaw/demo
```

Os diagnósticos visíveis ao proprietário podem explicar o estado de verificação, bloqueio de envio ou moderação.

## A publicação falha porque metadados obrigatórios estão ausentes

Para Skills, verifique o frontmatter do arquivo `SKILL.md`. As variáveis de ambiente e ferramentas obrigatórias devem ser declaradas para que os usuários e verificadores possam compreender o pacote.

Para plugins, verifique os metadados de compatibilidade em `package.json`. Publicações de plugins de código precisam de campos de compatibilidade do OpenClaw, como `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

Primeiro, visualize os dados da publicação:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## A publicação falha devido a um erro de proprietário ou origem do GitHub

O ClawHub usa a identidade e a atribuição de origem do GitHub para associar os pacotes aos respectivos publicadores.

- Verifique se você entrou com a conta do GitHub que possui o pacote ou pode publicá-lo.
- Verifique se a URL de origem é pública ou acessível ao ClawHub.
- Para origens do GitHub, use `owner/repo`, `owner/repo@ref` ou uma URL completa do GitHub.

## A publicação falha porque um namespace foi reivindicado ou reservado

Se uma publicação falhar porque o identificador do proprietário, o namespace da organização, o escopo do pacote, o slug da Skill ou o nome do pacote já foi reivindicado ou reservado, primeiro confirme se você está publicando com o proprietário correspondente ao namespace. Para pacotes de plugins, nomes com escopo, como `@example-org/example-plugin`, devem ser publicados pelo proprietário `example-org` correspondente.

Se você acredita que sua organização, seu projeto ou sua marca é o legítimo proprietário do namespace, mas não consegue gerenciar o proprietário atual no ClawHub, abra uma [issue de reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) com comprovação pública e não confidencial. Consulte [Reivindicações de organizações e namespaces](/clawhub/namespace-claims) para obter orientações sobre as evidências e saber o que não deve ser incluído em issues públicas.

## `sync` informa que nenhuma Skill foi encontrada

`sync` procura pastas que contenham `SKILL.md` ou `skill.md`.

Direcione-o para os diretórios raiz que você deseja verificar:

```bash
clawhub sync --root /path/to/skills
```

Primeiro, visualize o resultado se você não tiver certeza do que será publicado:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` se recusa a continuar devido a alterações locais

Os arquivos locais não correspondem a nenhuma versão conhecida pelo ClawHub. Escolha uma opção:

- Mantenha as edições locais e ignore a atualização.
- Sobrescreva os arquivos com a versão publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publique sua cópia editada com um novo slug ou como um fork.

## A instalação de um Plugin falha no OpenClaw

- Use uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Verifique a página de detalhes do pacote para consultar o estado da verificação e os metadados de compatibilidade.
- Confirme se sua versão do OpenClaw atende ao intervalo de compatibilidade anunciado pelo pacote.
- Se o pacote estiver oculto, retido ou bloqueado, talvez não seja possível instalá-lo até que o proprietário resolva o problema.

## As solicitações à API pública falham

- Respeite os cabeçalhos de nova tentativa das respostas `429` e armazene em cache as respostas públicas de listagem e busca.
- Direcione os usuários de volta para a listagem canônica do ClawHub.
- Não replique conteúdo oculto, privado, retido ou bloqueado pela moderação fora da superfície da API pública.

Consulte [API HTTP](/clawhub/http-api) para obter detalhes dos endpoints.
