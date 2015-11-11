Before Juicebox, there was Hookup!
==================================

This repository contains the codebase for Hookup, an edgy and entertaining sex education mobile web app aimed at teens. I started building this app in February 2015 as the only developer on a three person team with Founder Brianna Rader and designer T Sripunvoraskul. After beta testing at the [University of Tennessee's Sex Week](http://www.knoxmercury.com/2015/04/08/ut-sex-week-co-founder-brianna-rader-prepares-to-release-a-sex-week-style-app/), we were accepted into 4.0 Schools' [Launch](http://4pt0.org/2015/05/27/introducing-launch-cohort-11/) program and even got written up in the [NY Times](http://www.nytimes.com/roomfordebate/2015/04/28/whats-the-best-way-to-teach-sex-ed-today).

Hookup has now changed names to [Juicebox](http://www.juiceboxit.com) and should be releasing an iOS app shortly, along with a revamped web app in the future.

While http://www.dohookup.com now redirects to Juicebox, the old Hookup [landing page](http://hookup-prod.elasticbeanstalk.com/) and [main site](http://hookup-prod.elasticbeanstalk.com/launch/) can still be viewed.

I created the site in Node.js/Express with a MySQL database and EJS/jQuery on the front end all deployed using Elastic Beanstalk from AWS. For user authentication I used Passport. The site has two main features:

* Chat with a Sexpert
* Share Your Story

The chat feature was definitely the hardest to figure out, and one of the main reasons I chose to use Node (besides that I was using it at work) was so I could use socket.io. Sexperts had to each be able to have chats going on with multiple users while everything was recorded in the database. We also e-mailed users and sexperts regarding the chat, which required using the Mandrill API.

I would like to give special thanks to Elnaz Moshfeghian who helped out with the site's CSS and HTML for the landing, home, and chat pages at the beginning when I had little experience with front end work. Greg Baraghimian also deserves credit for his work on creating the chat feed using EJS and contributing to the stories API.

Final note: server.js, app/mailchimp.js, app/mailer.js, app/mandrill.js, and config/database.js all contained sensitive information that I didn't bother with earlier because I was using a private Bitbucket. I used git-filter-branch to remove them from all commits and added them back at the end.
