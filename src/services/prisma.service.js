import { PrismaClient } from '@prisma/client';


const types = {
  ONLINE_SESSION: 'onlineSession',
  PLACEMENT: 'placement'
};


const prisma = (new PrismaClient()).$extends({
  result: {
    learningPath: {
      target: {
        needs: {
          targetable_id: true,
          targetable_type: true
        },
        compute: (item) => {            
          return item.target ?? {
            id: item.targetable_id,
            type: item.targetable_type
          };        
        }
      }
    }
  },
  query: {
    learningPath: {
      findMany: async ({args, query}) => {

        const res = await query(args);
        if (args.select?.target) {
            
          const groupBy = Object.groupBy(res, (item) => item.targetable_type);        

          const targets = await Promise.all(Object.keys(groupBy)?.map(group => {
            return prisma[types[group]].findMany({
              where: {
                id: {
                  in: groupBy[group].map(item => item.targetable_id)
                }
              },
              select: args?.select?.target?.[group]
            });
          }));

          return res?.map(item => ({
            ...item,
            type: item.targetable_type,
            target: targets?.[Object.keys(groupBy)?.indexOf(item.targetable_type)]?.find(x => x.id === item.targetable_id )
          }));
        }
        return res;
      }
    }
  }
});

// TODO: Add Prisma extensions or middleware here if needed

export default prisma;
