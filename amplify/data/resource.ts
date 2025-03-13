import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  // User model
  User: a.model({
      email: a.email().required(),
      name: a.string().required(),
      role: a.enum(['SUPERVISOR', 'COUNTER']),
      assignments: a.hasMany('Assignment','userID'),
      stockcounts: a.hasMany('StockCount', 'createdBy'),
      discrepanies:a.hasMany('Discrepancy', 'resolvedBy'),
    })
    .authorization((allow) => [
      allow.groups(['ADMIN']).to(['create', 'read', 'update', 'delete']),
      allow.owner().to(['read', 'update']),
      allow.groups(['SUPERVISOR']).to(['read']),
    ]),
  // StockCount model
  StockCount: a.model({
      name: a.string().required(),
      date: a.date().required(),
      type: a.string().required(),
      status: a.enum(['CREATED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED']),
      areas: a.hasMany('Area','stockCountID'),
      createdBy: a.id(),
      creator: a.belongsTo('User','createdBy'),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.groups(['ADMIN']).to(['create', 'read', 'update', 'delete']),
      allow.groups(['COUNTER']).to(['read']),
    ]),

  // Area model
  Area: a
    .model({
      stockCountID: a.id(),
      stockCount: a.belongsTo('StockCount','stockCountID'),
      name: a.string().required(),
      description: a.string().required(),
      status: a
        .enum([
          'NOT_STARTED',
          'IN_PROGRESS',
          'PENDING_COMPARISON',
          'PENDING_APPROVAL',
          'APPROVED',
          'REJECTED',
        ])
        ,
      assignments: a.hasMany('Assignment','areaID'),
      comparisions: a.hasMany('Comparison', 'areaID'),
      
    })
    .authorization((allow) => [
      allow.groups(['ADMIN', 'SUPERVISOR']).to(['create', 'read', 'update', 'delete']),
      allow.groups(['COUNTER']).to(['read']),
    ])
    .secondaryIndexes((index) => [
      index('name')
        .name("byStockCount"),
    ]),

  // Assignment model
  Assignment: a
    .model({
      areaID: a.id(),
      area: a.belongsTo('Area','areaID'),
      userID: a.id(),
      user: a.belongsTo('User','userID'),
      status: a
        .enum(['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'])
      ,
      sessions: a.hasMany('CountSession','assignmentID'),
      firstassigments: a.hasMany('Comparison', 'firstAssignmentID'),
      secondasigments: a.hasMany('Comparison', 'secondAssignmentID'),
      assignedAt: a.datetime().required(),
      startedAt: a.datetime().required(),
      completedAt: a.datetime().required(),
  
    })
    .authorization((allow) => [
      allow.groups(['Admins', 'Supervisors']).to(['create', 'read', 'update', 'delete']),
      allow.owner().to(['read']),
    ])
    .secondaryIndexes((index) => [
      index('areaID')
      .name("byArea"),
      index('userID')
        .name("byUser"),
    ]),
   
  // CountSession model
  CountSession: a
    .model({
      assignmentID: a.string().required(),
      assignment: a.belongsTo('Assignment','assignmentID'),
      userID: a.string().required(),
      status: a.enum(['ACTIVE', 'PAUSED', 'COMPLETED']),
      startTime: a.datetime().required(),
      endTime: a.datetime().required(),
      counteditems: a.hasMany('CountItem', 'sessionID'),
      
      
    })
    .authorization((allow) => [
      allow.groups(['Admins', 'Supervisors']).to(['read', 'delete']),
      allow.owner().to(['create', 'read', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('assignmentID')
      .sortKeys(['startTime'])
      .name("byAssignment"),
    ]),

  // CountItem model
  CountItem: a
    .model({
      sessionID: a.id(),
      session: a.belongsTo('CountSession','sessionID'),
      userID: a.string().required(),
      itemNumber: a.string().required(),
      sku: a.string().required(),
      upc: a.string().required(),
      description: a.string().required(),
      quantity: a.integer().required(),
      unitOfMeasure: a.string().required(),
      location: a.string().required(),
      photoURL: a.string().required(),
      notes: a.string().required(),
      
    })
    .authorization((allow) => [
      allow.groups(['Admins', 'Supervisors']).to(['read']),
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('sessionID')
        .name("bySession"),
      index('itemNumber')
        .name("byItemNumber"),
      index('sku')
        .name("bySKU")
    ]),

  // Comparison model
  Comparison: a
    .model({
      areaID: a.id(),
      area: a.belongsTo('Area','areaID'),
      firstAssignmentID: a.string().required(),
      firstAssignment: a.belongsTo('Assignment','firstAssignmentID'),
      secondAssignmentID: a.string().required(),
      secondAssignment: a.belongsTo('Assignment','secondAssignmentID'),
      status: a.enum(['PENDING', 'MATCHED', 'DISCREPANCY']),
      discrepancies: a.hasMany('Discrepancy','comparisonID'),
      varianceRate: a.float(),
      processedAt: a.datetime().required(),
      
    })
    .authorization((allow) => [
      allow.groups(['Admins', 'Supervisors']).to(['create', 'read', 'update', 'delete']),
    ])
    .secondaryIndexes((index) => [
      index('areaID')
        .name("byArea"),
    ])
    ,

  // Discrepancy model
  Discrepancy: a
    .model({
      comparisonID: a.string().required(),
      comparison: a.belongsTo('Comparison','comparisonID'),
      itemNumber: a.string().required(),
      sku: a.string().required(),
      description: a.string().required(),
      firstCount: a.integer().required(),
      secondCount: a.integer().required(),
      variance: a.integer().required(),
      variancePercentage: a.float().required(),
      status: a.enum(['OPEN', 'RESOLVED', 'APPROVED']),
      resolvedBy: a.string().required(),
      resolver: a.belongsTo('User','resolvedBy'),
      resolvedAt: a.datetime().required(),
      notes: a.string().required(),

    })
    .authorization((allow) => [
      allow.groups(['Admins', 'Supervisors']).to(['read', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('comparisonID')
        .name("byComparison"),
    ]),
});

export type Schema = ClientSchema<typeof schema>;


export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
