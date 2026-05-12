---
read_when:
    - Analisando uploads em busca de abuso ou violações de políticas
    - Redação de documentação de moderação ou guias operacionais para revisores
    - Decidir se uma habilidade deve ser ocultada ou se um usuário deve ser banido
summary: 'Política do Marketplace: o que o ClawHub permite e o que ele não hospedará.'
x-i18n:
    generated_at: "2026-05-12T15:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

Esta página descreve os tipos de habilidades e conteúdo que o ClawHub aceita, e os fluxos de trabalho de abuso que ele não hospedará.

Estas regras são intencionalmente práticas. O que mais importa para nós são fluxos de trabalho de abuso de ponta a ponta, não apenas palavras-chave isoladas. Se uma habilidade foi criada para contornar defesas, abusar de plataformas, aplicar golpes, invadir a privacidade ou permitir comportamento sem consentimento, ela não pertence ao ClawHub.

## Padrões recentes que aceitamos explicitamente

- Trabalho de frontend e design system que usa componentes reais, tokens semânticos, estados acessíveis e fluxos de usuário testados.
- Composição com shadcn/ui que usa componentes-fonte instalados, aliases do projeto e variantes documentadas em vez de marcação pontual.
- Conversão de JavaScript para TypeScript no UI5 que preserva comentários, usa tipos concretos do UI5 e mantém interfaces de controles geradas revisáveis.
- Revisão de segurança defensiva, ferramentas de moderação e prompts de detecção de abuso que mostram evidências e mantêm claros os limites de aprovação humana.
- Automação de fluxos de trabalho baseada em consentimento para contas pessoais ou de equipe com credenciais explícitas, configuração transparente e modos de simulação ou pré-visualização.
- Documentação, runbooks de migração, utilitários para desenvolvedores e fixtures de teste com escopo limitado ao software que dão suporte.

## Não aceito

- Fluxos de trabalho de contorno de segurança ou acesso não autorizado.
  - Exemplos: bypass de autenticação, tomada de conta, bypass de CAPTCHA, evasão de Cloudflare ou antibot, bypass de limite de taxa, scraping furtivo projetado para derrotar proteções, tomada de chamada ou agente ao vivo, roubo de sessão reutilizável, aprovação automática de fluxos de pareamento para usuários não aprovados.

- Abuso de plataforma e evasão de banimento.
  - Exemplos: contas furtivas após banimentos, aquecimento/cultivo de contas, engajamento falso, cultivo de karma ou seguidores, automação de múltiplas contas, postagem em massa, bots de spam, automação de marketplace ou social criada para evitar detecção.

- Fraude, golpes e fluxos de trabalho financeiros enganosos.
  - Exemplos: certificados falsos, faturas falsas, fluxos de pagamento enganosos, contato para golpe, prova social falsa, ferramentas que permitem gastar ou cobrar sem aprovação humana clara e controles transparentes, ou fluxos de trabalho de identidade sintética criados para abrir contas para fraude.

- Scraping, enriquecimento ou vigilância invasivos à privacidade.
  - Exemplos: scraping de dados de contato em escala para spam, doxxing, perseguição, extração de leads combinada com contato não solicitado, monitoramento encoberto, busca facial ou correspondência biométrica usada sem consentimento claro, ou compra, publicação, download ou operacionalização de dados vazados ou dumps de violações.

- Personificação sem consentimento ou manipulação enganosa de identidade.
  - Exemplos: troca de rosto, gêmeos digitais, personas falsas, influenciadores clonados ou outras ferramentas de manipulação de identidade usadas para personificar ou enganar.

- Conteúdo sexual explícito e geração adulta com segurança desativada.
  - Exemplos: geração de imagens/vídeos/conteúdo NSFW, wrappers de conteúdo adulto em torno de APIs de terceiros ou habilidades cujo objetivo principal seja conteúdo sexual explícito.

- Requisitos de execução ocultos, inseguros ou enganosos.
  - Exemplos: comandos de instalação ofuscados, `curl | sh`, requisitos de segredos não declarados, uso de chave privada não declarado, execução remota de `npx @latest` sem revisabilidade clara, metadados enganosos que ocultam o que a habilidade realmente precisa para ser executada.

## Padrões recentes que explicitamente não aceitamos

- “Crie contas de vendedor furtivas após banimentos em marketplaces.”
- “Modifique o pareamento do Telegram para que usuários não aprovados recebam automaticamente códigos de pareamento.”
- “Cultive contas do Reddit/Twitter com automação indetectável.”
- “Gere certificados profissionais ou faturas para uso arbitrário.”
- “Gere conteúdo NSFW com verificações de segurança desativadas.”
- “Raspe leads, enriqueça contatos e lance contato frio em escala.”
- “Compre, publique ou baixe dados vazados ou dumps de violações.”
- “Crie em massa contas de email ou redes sociais com identidades sintéticas ou resolução de CAPTCHA.”

## Observações para revisores

- O contexto importa. O mesmo tópico pode ser legítimo em um cenário defensivo restrito ou baseado em consentimento e inaceitável quando empacotado como fluxo de trabalho de abuso.
- Devemos tender à ação quando uma habilidade estiver claramente otimizada para evasão, engano ou uso sem consentimento.
- Uploads repetidos nessas categorias são motivo para ocultar conteúdo e banir a conta.

## Aplicação

- Podemos ocultar, remover ou excluir permanentemente habilidades que violem estas regras.
- Podemos revogar tokens, excluir temporariamente conteúdo associado e banir infratores recorrentes ou graves.
- Não garantimos aplicação com aviso prévio para abuso evidente.
