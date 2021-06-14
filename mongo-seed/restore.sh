#! /bin/bash
echo "Starting to import data..."

mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection comments --type json --file /mongo-seed/dump/initComments.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection notifications --type json --file /mongo-seed/dump/initNotifications.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection reviews --type json --file /mongo-seed/dump/initReviews.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection stores --type json --file /mongo-seed/dump/initStores.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection users --type json --file /mongo-seed/dump/initUsers.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection metros --type json --file /mongo-seed/dump/initMetros.json --jsonArray --drop
mongoimport --host="mongo1:27017,mongo2:27017,mongo3:27017" --db ramen_group --collection storerelations --type json --file /mongo-seed/dump/initStoreRelations.json --jsonArray --drop

echo "Done."