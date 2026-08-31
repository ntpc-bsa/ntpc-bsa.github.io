source "https://rubygems.org"

# 這個站以前靠 GitHub Pages 內建建置，所以綁 github-pages gem（它會鎖住 Jekyll 3.9）。
# 改成在 Cloudflare Pages 自己建置之後就沒有這個限制，直接用 Jekyll 4：建置較快，
# 也不再被 github-pages 的相依版本綁住。
gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
end

# Windows 與 JRuby 沒有內建時區資料
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
