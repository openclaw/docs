---
read_when:
    - Falha nos comandos da CLI do ClawHub ou do registro do OpenClaw
    - Um pacote não pode ser instalado, publicado nem atualizado
summary: Solução de problemas de login, instalação, publicação, atualização e API do ClawHub.
x-i18n:
    generated_at: "2026-07-16T12:19:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solução de problemas

## `clawhub login` abre um navegador, mas nunca é concluído

A CLI inicia um servidor de callback local de curta duração durante o login pelo navegador.

- Verifique se o navegador consegue acessar `http://127.0.0.1:<port>/callback`.
- Verifique as regras locais de firewall, VPN e proxy se o callback nunca chegar.
- Em ambientes sem interface gráfica, crie um token de API na interface web do ClawHub e execute:

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` retorna `Unauthorized` (401)

- Entre novamente com `clawhub login`.
- Se você usa um caminho de configuração personalizado, confirme se `CLAWHUB_CONFIG_PATH` aponta para o
  arquivo que contém seu token atual.
- Se você usa um token de API, confirme se ele não foi revogado na interface web.

## A pesquisa ou instalação retorna `Rate limit exceeded` (429)

Leia as informações de nova tentativa na resposta:

- `Retry-After`: segundos de espera antes de tentar novamente.
- `RateLimit-Limit`: o limite aplicado a esta solicitação.
- `RateLimit-Remaining`: seu orçamento restante exato quando o cabeçalho estiver presente. Em `429`, ele é `0`.
- `RateLimit-Reset` ou `X-RateLimit-Reset`: momento da redefinição.

Se muitos usuários compartilham um único IP de saída, os limites de IP para acesso anônimo podem ser atingidos mesmo quando cada
pessoa envia apenas algumas solicitações. Entre sempre que possível e tente novamente após o
atraso informado.

## A pesquisa ou instalação falha por trás de um proxy

A CLI respeita as variáveis de proxy padrão:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Os nomes compatíveis incluem `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Uma skill não aparece na pesquisa

- Verifique o slug exato ou a página do proprietário, caso os conheça.
- Confirme se a versão é pública e não está retida por verificação ou moderação.
- Se a skill for sua, entre e inspecione-a:

```bash
clawhub inspect @openclaw/demo
```

Os diagnósticos visíveis para o proprietário podem explicar o estado da verificação, do bloqueio de upload ou da moderação.

## A publicação falha porque faltam metadados obrigatórios

Para skills, verifique o frontmatter de `SKILL.md`. As variáveis de ambiente e
ferramentas obrigatórias devem ser declaradas para que os usuários e verificadores possam compreender o pacote.

Para plugins, verifique os metadados de compatibilidade de `package.json`. As publicações de
plugins de código precisam de campos de compatibilidade com o OpenClaw, como `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Primeiro, visualize a carga útil da publicação:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## A publicação falha com um erro de proprietário ou origem do GitHub

O ClawHub usa a identidade e a atribuição de origem do GitHub para vincular os pacotes aos seus
publicadores.

- Verifique se você entrou com a conta do GitHub que possui ou pode publicar
  o pacote.
- Verifique se a URL de origem é pública ou acessível ao ClawHub.
- Para origens do GitHub, use `owner/repo`, `owner/repo@ref` ou uma URL completa do GitHub.

## A publicação falha porque um namespace já foi reivindicado ou reservado

Se uma publicação falhar porque o identificador do proprietário, o namespace da organização, o escopo do pacote, o slug da skill
ou o nome do pacote já foi reivindicado ou reservado, primeiro confirme se você está
publicando com o proprietário correspondente ao namespace. Para pacotes de plugins,
nomes com escopo, como `@example-org/example-plugin`, devem ser publicados pelo
proprietário `example-org` correspondente.

Se você acredita que sua organização, seu projeto ou sua marca é o proprietário legítimo do namespace, mas
não consegue gerenciar o proprietário atual no ClawHub, abra uma
[issue de reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com comprovação pública e não confidencial. Consulte
[Reivindicações de organizações e namespaces](/clawhub/namespace-claims) para obter orientações sobre as evidências e o que
não incluir em issues públicas.

## `sync` informa que nenhuma skill foi encontrada

`sync` procura pastas que contenham `SKILL.md` ou `skill.md`.

Aponte-o para as raízes que deseja verificar:

```bash
clawhub sync --root /path/to/skills
```

Primeiro, visualize o resultado caso não tenha certeza do que será publicado:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` recusa a operação devido a alterações locais

Os arquivos locais não correspondem a nenhuma versão conhecida pelo ClawHub. Escolha uma opção:

- Mantenha as edições locais e ignore a atualização.
- Sobrescreva com a versão publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publique sua cópia editada como um novo slug ou fork.

## A instalação de um plugin falha no OpenClaw

- Use uma origem explícita do ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Verifique na página de detalhes do pacote o status da verificação e os metadados de compatibilidade.
- Confirme se sua versão do OpenClaw atende ao intervalo de compatibilidade
  anunciado pelo pacote.
- Se o pacote estiver oculto, retido ou bloqueado, talvez ele não possa ser instalado até que
  o proprietário resolva o problema.

## As solicitações à API pública falham

- Respeite os cabeçalhos de nova tentativa de `429` e armazene em cache as respostas públicas de listagem/pesquisa.
- Direcione os usuários de volta à listagem oficial do ClawHub.
- Não espelhe conteúdo oculto, privado, retido ou bloqueado pela moderação fora da
  superfície da API pública.

Consulte [API HTTP](/clawhub/http-api) para obter detalhes dos endpoints.
