import { useState } from 'react'

type Method = {
  id: string
  title: string
  difficulty: 'Kolay' | 'Orta' | 'Zor'
  risk: 'Düşük' | 'Orta' | 'Yüksek'
  description: string
  steps: string[]
  code?: string
  note?: string
}

const methods: Method[] = [
  {
    id: 'mailmap',
    title: '.mailmap Dosyası Kullanmak',
    difficulty: 'Kolay',
    risk: 'Düşük',
    description: 'Git\'in .mailmap özelliği ile commit yazarlarını yeniden eşleştirebilirsiniz. Bu yöntem git geçmişini değiştirmez, sadece gösterimi etkiler.',
    steps: [
      'Proje kök dizinine .mailmap adında bir dosya oluşturun',
      'qwen-intl\'nin kullandığı email adresini kendi email adresinize yönlendirin',
      'Dosyayı commit edip push edin',
      'GitHub\'ın cache\'i temizlemesi birkaç dakika sürebilir'
    ],
    code: `# .mailmap dosyası içeriği
# Format: Doğru İsim <doğru@email> Yanlış İsim <yanlış@email>

# qwen-intl'nin commit'lerini kendi adınıza yönlendirin:
Sizin Adınız <sizin@email.com> qwen-intl <qwen-intl@users.noreply.github.com>

# Eğer sadece isim farklıysa:
Sizin Adınız <sizin@email.com> qwen-intl`,
    note: '⚠️ Bu yöntem GitHub\'ın contributor sayfasında ismi değiştirir ancak bazı durumlarda tam olarak gizlenmeyebilir. GitHub\'ın cache sistemi nedeniyle değişiklik hemen görünmeyebilir.'
  },
  {
    id: 'filter-repo',
    title: 'git filter-repo ile Geçmişi Yeniden Yazmak',
    difficulty: 'Orta',
    risk: 'Yüksek',
    description: 'git-filter-repo aracı ile tüm git geçmişindeki author/committer bilgilerini değiştirebilirsiniz. Bu yöntem kalıcıdır ve tüm commit\'leri yeniden yazar.',
    steps: [
      'git-filter-repo aracını kurun: pip install git-filter-repo',
      'Repo\'nun tam bir klonunu alın (shallow clone değil!)',
      'Aşağıdaki komutu çalıştırarak author bilgilerini değiştirin',
      'Force push ile değişiklikleri GitHub\'a gönderin',
      'Diğer contributor\'lara repo\'yu yeniden klonlamalarını söyleyin'
    ],
    code: `# git-filter-repo kurulumu
pip install git-filter-repo

# Tüm commit'lerdeki qwen-intl author'unu kendinize yönlendirin
git filter-repo --mailmap .mailmap --force

# Veya doğrudan komut satırında:
git filter-repo --email-callback '
  if b"qwen-intl" in email:
    return b"sizin@email.com"
  return email
' --name-callback '
  if name == b"qwen-intl":
    return b"Sizin Adınız"
  return name
' --force

# Değişiklikleri GitHub'a gönderin
git push --force --all
git push --force --tags`,
    note: '⚠️ DİKKAT: Bu yöntem tüm commit hash\'lerini değiştirir. Eğer başka kişiler bu repo\'yu kullanıyorsa, herkesin repo\'yu yeniden klonlaması gerekir. Force push gerektirir ve geri alınamaz!'
  },
  {
    id: 'filter-branch',
    title: 'git filter-branch (Eski Yöntem)',
    difficulty: 'Zor',
    risk: 'Yüksek',
    description: 'git filter-branch, git-filter-repo\'nun eski versiyonudur. Hala çalışır ancak resmi olarak önerilmez.',
    steps: [
      'Repo\'nun tam klonunu alın',
      'Aşağıdaki filter-branch komutunu çalıştırın',
      'Force push yapın',
      'Reflog ve garbage collection temizliği yapın'
    ],
    code: `# git filter-branch ile author değiştirme
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "qwen-intl@users.noreply.github.com" ]; then
    export GIT_AUTHOR_NAME="Sizin Adınız"
    export GIT_AUTHOR_EMAIL="sizin@email.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "qwen-intl@users.noreply.github.com" ]; then
    export GIT_COMMITTER_NAME="Sizin Adınız"
    export GIT_COMMITTER_EMAIL="sizin@email.com"
fi
' --tag-name-filter cat -- --all

# Force push
git push --force --all

# Temizlik
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now`,
    note: '⚠️ Bu yöntem artık önerilmemektedir. Mümkünse git-filter-repo kullanın.'
  },
  {
    id: 'settings',
    title: 'GitHub Repo Ayarları (Kısmi Çözüm)',
    difficulty: 'Kolay',
    risk: 'Düşük',
    description: 'GitHub\'ın bazı ayarları ile contributor görünümünü kısmen kontrol edebilirsiniz, ancak tam bir gizleme seçeneği yoktur.',
    steps: [
      'Repo Settings > Collaborators bölümüne gidin',
      'Eğer qwen-intl bir collaborator olarak eklenmişse kaldırın',
      'Insights > Contributors sayfasını kontrol edin',
      'Not: Commit geçmişi varsa contributor olarak görünmeye devam edebilir'
    ],
    note: '💡 Bu yöntem sadece gelecekteki commit\'leri etkiler. Geçmiş commit\'ler için yukarıdaki yöntemlerden birini kullanmanız gerekir.'
  }
]

function App() {
  const [activeMethod, setActiveMethod] = useState<string>('mailmap')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const activeData = methods.find(m => m.id === activeMethod)!

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'Kolay': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Orta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Zor': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRiskColor = (r: string) => {
    switch (r) {
      case 'Düşük': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Orta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Yüksek': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-white">GitHub Contributors Gizleme Rehberi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Insights sayfasında <code className="bg-gray-800 px-2 py-0.5 rounded text-orange-400">qwen-intl</code> gibi istenmeyen contributor'ları gizleme yöntemleri
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Answer */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Hızlı Cevap
          </h2>
          <p className="text-gray-300 leading-relaxed">
            GitHub'da Insights/Contributors kısmından bir kullanıcıyı <strong className="text-white">tamamen gizlemenin</strong> resmi bir yolu yoktur. 
            Ancak <strong className="text-green-400">.mailmap</strong> dosyası kullanarak commit yazarlığını kendi adınıza yönlendirebilir veya 
            <strong className="text-yellow-400"> git filter-repo</strong> ile geçmişi yeniden yazabilirsiniz. 
            En güvenli ve önerilen yöntem <strong className="text-green-400">.mailmap</strong> kullanmaktır.
          </p>
        </div>

        {/* Why does this happen */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>🤔</span> Neden qwen-intl Görünüyor?
          </h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Eğer AI destekli bir araç (Qwen gibi) ile commit'ler oluşturduysanız veya bir bot/automation kullandıysanız, 
            commit'lerin author bilgisi <code className="bg-gray-800 px-2 py-0.5 rounded text-orange-400">qwen-intl</code> olarak kaydedilmiş olabilir. 
            GitHub, commit'lerdeki author email'ine göre contributor listesini oluşturur.
          </p>
          <div className="bg-[#0d1117] border border-gray-700 rounded p-4 font-mono text-sm">
            <div className="text-gray-500"># Commit author bilgisini kontrol edin:</div>
            <div className="text-green-400">git log --format="%an &lt;%ae&gt;" | sort | uniq -c | sort -rn</div>
          </div>
        </div>

        {/* Methods */}
        <h2 className="text-xl font-bold text-white mb-4">🛠️ Yöntemler</h2>
        
        {/* Method Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {methods.map(method => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(method.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMethod === method.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-[#161b22] text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {method.title}
            </button>
          ))}
        </div>

        {/* Active Method Detail */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h3 className="text-lg font-bold text-white">{activeData.title}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(activeData.difficulty)}`}>
              Zorluk: {activeData.difficulty}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(activeData.risk)}`}>
              Risk: {activeData.risk}
            </span>
          </div>

          <p className="text-gray-300 mb-4">{activeData.description}</p>

          {/* Steps */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Adımlar</h4>
            <ol className="space-y-2">
              {activeData.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Code Block */}
          {activeData.code && (
            <div className="mb-6">
              <div className="flex items-center justify-between bg-[#0d1117] border border-gray-700 rounded-t-lg px-4 py-2">
                <span className="text-xs text-gray-500 font-mono">Terminal / .mailmap</span>
                <button
                  onClick={() => copyCode(activeData.code!, activeData.id)}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {copiedCode === activeData.id ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kopyalandı!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopyala
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#0d1117] border border-t-0 border-gray-700 rounded-b-lg p-4 overflow-x-auto text-sm">
                <code className="text-green-400 font-mono whitespace-pre">{activeData.code}</code>
              </pre>
            </div>
          )}

          {/* Note */}
          {activeData.note && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-200/80 text-sm">{activeData.note}</p>
            </div>
          )}
        </div>

        {/* Recommendation */}
        <div className="mt-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>✅</span> Önerilen Yaklaşım
          </h3>
          <div className="text-gray-300 space-y-3">
            <p>
              <strong className="text-green-400">Senaryo 1:</strong> Repo sadece sizin ise ve kimseyle paylaşmıyorsanız → 
              <strong className="text-white"> git filter-repo</strong> kullanın. Temiz bir çözüm sunar.
            </p>
            <p>
              <strong className="text-green-400">Senaryo 2:</strong> Repo'da başka contributor'lar varsa → 
              <strong className="text-white"> .mailmap</strong> kullanın. Geçmişi bozmaz, sadece gösterimi değiştirir.
            </p>
            <p>
              <strong className="text-green-400">Senaryo 3:</strong> Sadece gelecekteki commit'leri kontrol etmek istiyorsanız → 
              Git config'inizi kontrol edin: <code className="bg-gray-800 px-2 py-0.5 rounded text-orange-400">git config user.email</code>
            </p>
          </div>
        </div>

        {/* Prevention */}
        <div className="mt-8 bg-[#161b22] border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🛡️</span> Gelecekte Önlemek İçin
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Git Config Kontrolü</h4>
              <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`git config user.name "Adınız"
git config user.email "email@adres.com"

# Kontrol:
git config --list | grep user`}
              </pre>
            </div>
            <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Pre-commit Hook</h4>
              <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`# .git/hooks/pre-commit
#!/bin/sh
EMAIL=$(git config user.email)
if [ "$EMAIL" != "sizin@email.com" ]; then
  echo "Yanlış email: $EMAIL"
  exit 1
fi`}
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Bu rehber genel bilgilendirme amaçlıdır. Git geçmişini değiştirmeden önce yedek almayı unutmayın.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
