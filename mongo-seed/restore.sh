#! /bin/bash
mongoimport --host mongodb --db ramen_group --collection comments --type json --file /mongo-seed/dump/initComments.json --jsonArray
mongoimport --host mongodb --db ramen_group --collection notifications --type json --file /mongo-seed/dump/initNotifications.json --jsonArray
mongoimport --host mongodb --db ramen_group --collection reviews --type json --file /mongo-seed/dump/initReviews.json --jsonArray
mongoimport --host mongodb --db ramen_group --collection stores --type json --file /mongo-seed/dump/initStores.json --jsonArray
mongoimport --host mongodb --db ramen_group --collection users --type json --file /mongo-seed/dump/initUsers.json --jsonArray